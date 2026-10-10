import "dotenv/config";
import { generateAccessToken } from "../src/utils/jwt.js";
import { prisma } from "../src/config/prisma.js";

async function main() {
    console.log("=== RUNNING PHASE 5 DETERMINISTIC PLANNER TESTS ===");

    // 1. Get user & workspace context
    const membership = await prisma.workspaceMember.findFirst({
        include: {
            user: true,
            workspace: {
                include: {
                    boards: {
                        include: {
                            lists: true,
                        },
                    },
                },
            },
        },
    });
    if (!membership) throw new Error("No membership found");

    const user = membership.user;
    const workspace = membership.workspace;
    const list = workspace.boards.flatMap((b) => b.lists)[0];
    if (!list) throw new Error("No list found");

    const token = generateAccessToken(user.id);
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
    const baseUrl = "http://localhost:3000/api/v1";

    console.log(`Testing with User: ${user.name} (${user.id}), Workspace: ${workspace.name}`);

    // Create a set of test tasks with distinct planning scenarios:
    // Task 1: Prerequisite task (Medium, 30 min, incomplete)
    const taskPrereq = await prisma.task.create({
        data: {
            title: "P5 Prerequisite Base Task",
            listId: list.id,
            position: 100,
            priority: "MEDIUM",
            estimatedMinutes: 30,
            completed: false,
        },
    });

    // Task 2: Blocked task (Urgent, but depends on Task 1)
    const taskBlocked = await prisma.task.create({
        data: {
            title: "P5 Urgent But Blocked Task",
            listId: list.id,
            position: 200,
            priority: "URGENT",
            estimatedMinutes: 45,
            completed: false,
        },
    });
    await prisma.taskDependency.create({
        data: {
            taskId: taskBlocked.id,
            dependsOnId: taskPrereq.id,
        },
    });

    // Task 3: Overdue task (High, 60 min, due yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const taskOverdue = await prisma.task.create({
        data: {
            title: "P5 Overdue Task",
            listId: list.id,
            position: 300,
            priority: "HIGH",
            dueDate: yesterday,
            estimatedMinutes: 60,
            completed: false,
        },
    });

    // Task 4: Due today task (Urgent, 30 min, due today)
    const todayDue = new Date();
    const taskDueToday = await prisma.task.create({
        data: {
            title: "P5 Due Today Urgent Task",
            listId: list.id,
            position: 400,
            priority: "URGENT",
            dueDate: todayDue,
            estimatedMinutes: 30,
            completed: false,
        },
    });

    // Task 5: Lower priority backlog task (Low, 120 min)
    const taskLow = await prisma.task.create({
        data: {
            title: "P5 Low Priority Task",
            listId: list.id,
            position: 500,
            priority: "LOW",
            estimatedMinutes: 120,
            completed: false,
        },
    });

    // TEST 1: Query GET /api/v1/planner/today with small time availability (availableMinutes=90)
    console.log("\n[TEST 1] Querying GET /api/v1/planner/today with availableMinutes=90...");
    const res1 = await fetch(
        `${baseUrl}/planner/today?workspaceId=${workspace.id}&availableMinutes=90`,
        { headers }
    );
    const data1 = await res1.json();
    if (!res1.ok || !data1.success) {
        throw new Error(`TEST 1 Failed: ${JSON.stringify(data1)}`);
    }

    const plan = data1.data;
    console.log(`Plan received: plannedTime="${plan.plannedTimeFormatted}", totalPlanned=${plan.summary.totalPlanned}`);

    // Verify blocked task is in sections.blocked, NOT in planned
    const isBlockedInSection = plan.sections.blocked.some((t: any) => t.id === taskBlocked.id);
    const isBlockedInPlanned =
        plan.sections.next?.id === taskBlocked.id ||
        plan.sections.upNext.some((t: any) => t.id === taskBlocked.id) ||
        plan.sections.later.some((t: any) => t.id === taskBlocked.id);

    if (!isBlockedInSection || isBlockedInPlanned) {
        throw new Error("TEST 1 Failed: Blocked task was not correctly isolated into sections.blocked!");
    }
    console.log("✓ TEST 1 Passed: Blocked task correctly placed in sections.blocked with blocking explanation.");

    // Verify overdue / due today task is prioritized first (NEXT or UP NEXT)
    console.log("\n[TEST 2] Verifying deterministic prioritization (overdue / urgent / due today first)...");
    const topPlannedIds = [
        plan.sections.next?.id,
        ...plan.sections.upNext.map((t: any) => t.id),
    ].filter(Boolean);

    if (!topPlannedIds.includes(taskOverdue.id) && !topPlannedIds.includes(taskDueToday.id)) {
        throw new Error(`TEST 2 Failed: Expected overdue or urgent due today task at the top. Top IDs: ${topPlannedIds}`);
    }
    console.log(`✓ TEST 2 Passed: Top planned task is "${plan.sections.next?.title}" (${plan.sections.next?.primaryReason}).`);

    // Verify time budget packing:
    // With availableMinutes=90, the total planned minutes should not exceed 90 (or if 1st task was >=90)
    console.log("\n[TEST 3] Verifying daily time availability constraint...");
    if (plan.plannedMinutes > 90 && plan.summary.totalPlanned > 1) {
        throw new Error(`TEST 3 Failed: Planned minutes ${plan.plannedMinutes} exceeded available 90 minutes across multiple tasks!`);
    }
    console.log(`✓ TEST 3 Passed: Planned minutes (${plan.plannedMinutes}m) respected availability (90m). Overflow has ${plan.sections.overflow.length} tasks.`);

    // TEST 4: Completing a prerequisite unblocks the dependent task!
    console.log("\n[TEST 4] Completing prerequisite task and verifying unblocking in replanned today...");
    const completeRes = await fetch(`${baseUrl}/tasks/${taskPrereq.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
            completed: true,
        }),
    });
    const completeData = await completeRes.json();
    if (!completeRes.ok || !completeData.data?.task?.completed) {
        throw new Error(`TEST 4 Complete failed: ${JSON.stringify(completeData)}`);
    }

    // Now re-fetch planner
    const res2 = await fetch(
        `${baseUrl}/planner/today?workspaceId=${workspace.id}&availableMinutes=480`,
        { headers }
    );
    const data2 = await res2.json();
    const plan2 = data2.data;

    const taskBlockedNow = [
        plan2.sections.next,
        ...plan2.sections.upNext,
        ...plan2.sections.later,
        ...plan2.sections.overflow,
    ].find((t: any) => t?.id === taskBlocked.id);

    if (!taskBlockedNow || taskBlockedNow.isBlocked) {
        throw new Error("TEST 4 Failed: Task should now be unblocked after prerequisite completion!");
    }
    console.log(`✓ TEST 4 Passed: Task is now unblocked and part of active plan! Completed today section has ${plan2.sections.completedToday.length} task(s).`);

    // Clean up test tasks
    await prisma.taskDependency.deleteMany({
        where: { taskId: taskBlocked.id },
    });
    await prisma.task.deleteMany({
        where: {
            id: {
                in: [taskPrereq.id, taskBlocked.id, taskOverdue.id, taskDueToday.id, taskLow.id],
            },
        },
    });
    console.log("Cleaned up test tasks.");

    console.log("\n=== ALL PHASE 5 BACKEND PLANNER TESTS PASSED! ===");
}

main()
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
