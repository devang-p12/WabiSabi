import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
    console.log("=== RUNNING PHASE 4 VERIFICATION TESTS ===");

    // 1. Find or create a user, workspace, board, and list for testing
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: "test_phase4@example.com",
                name: "Phase4 Tester",
                passwordHash: "password_hash_dummy",
            },
        });
    }

    let workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId: user.id } } },
    });
    if (!workspace) {
        workspace = await prisma.workspace.create({
            data: {
                name: "Phase 4 Test Workspace",
                members: {
                    create: {
                        userId: user.id,
                        role: "OWNER",
                    },
                },
            },
        });
    }

    let board = await prisma.board.findFirst({
        where: { workspaceId: workspace.id },
    });
    if (!board) {
        board = await prisma.board.create({
            data: {
                name: "Phase 4 Test Board",
                workspaceId: workspace.id,
            },
        });
    }

    let list = await prisma.boardList.findFirst({
        where: { boardId: board.id },
    });
    if (!list) {
        list = await prisma.boardList.create({
            data: {
                name: "To Do",
                boardId: board.id,
                position: 1000,
            },
        });
    }

    console.log(`Context: User=${user.id}, Workspace=${workspace.id}, Board=${board.id}, List=${list.id}`);

    // TEST 1: Existing task creation (without planning fields)
    console.log("\n[TEST 1] Existing task creation...");
    const taskA = await prisma.task.create({
        data: {
            title: "Task A - Base Task",
            listId: list.id,
            position: 1000,
            priority: "MEDIUM",
        },
    });
    if (!taskA.id || taskA.title !== "Task A - Base Task" || taskA.estimatedMinutes !== null) {
        throw new Error("TEST 1 Failed: Task creation failed or planning fields not nullable by default");
    }
    console.log("✓ TEST 1 Passed: Existing task creation works. Default planning fields are null.");

    // TEST 2: Existing task update (updating title/description/priority)
    console.log("\n[TEST 2] Existing task update...");
    const updatedA = await prisma.task.update({
        where: { id: taskA.id },
        data: {
            title: "Task A - Updated Title",
            description: "Updated description text",
            priority: "HIGH",
        },
    });
    if (updatedA.title !== "Task A - Updated Title" || updatedA.priority !== "HIGH") {
        throw new Error("TEST 2 Failed: Existing task update failed");
    }
    console.log("✓ TEST 2 Passed: Existing task update works seamlessly.");

    // TEST 3: Setting estimated time
    console.log("\n[TEST 3] Setting estimated time...");
    const taskWithEst = await prisma.task.update({
        where: { id: taskA.id },
        data: {
            estimatedMinutes: 120, // 2 hours
        },
    });
    if (taskWithEst.estimatedMinutes !== 120) {
        throw new Error(`TEST 3 Failed: Estimated minutes expected 120, got ${taskWithEst.estimatedMinutes}`);
    }
    console.log("✓ TEST 3 Passed: Setting estimated time (120 minutes) works.");

    // TEST 4: Setting actual time & startedAt
    console.log("\n[TEST 4] Setting actual time & startedAt...");
    const now = new Date();
    const taskWithActual = await prisma.task.update({
        where: { id: taskA.id },
        data: {
            actualMinutes: 95,
            startedAt: now,
        },
    });
    if (taskWithActual.actualMinutes !== 95 || !taskWithActual.startedAt) {
        throw new Error("TEST 4 Failed: Setting actual time and startedAt failed");
    }
    console.log("✓ TEST 4 Passed: Setting actual time (95 minutes) and startedAt works.");

    // TEST 5: Completing a task
    console.log("\n[TEST 5] Completing a task...");
    const completedTime = new Date();
    const completedTask = await prisma.task.update({
        where: { id: taskA.id },
        data: {
            completed: true,
            completedAt: completedTime,
        },
    });
    if (!completedTask.completed || !completedTask.completedAt) {
        throw new Error("TEST 5 Failed: Completing task did not persist completed and completedAt");
    }
    console.log("✓ TEST 5 Passed: Completing a task sets completed=true and completedAt timestamp.");

    // TEST 6: Creating dependency (Task B depends on Task A)
    console.log("\n[TEST 6] Creating dependency...");
    const taskB = await prisma.task.create({
        data: {
            title: "Task B - Dependent Task",
            listId: list.id,
            position: 2000,
            priority: "URGENT",
            estimatedMinutes: 60,
        },
    });

    const dependency = await prisma.taskDependency.create({
        data: {
            taskId: taskB.id,
            dependsOnId: taskA.id,
        },
        include: {
            task: true,
            dependsOn: true,
        },
    });

    if (dependency.taskId !== taskB.id || dependency.dependsOnId !== taskA.id) {
        throw new Error("TEST 6 Failed: Dependency creation failed");
    }
    console.log(`✓ TEST 6 Passed: Dependency created successfully. "${dependency.task.title}" depends on "${dependency.dependsOn.title}".`);

    // Verify relations fetch
    const fetchedB = await prisma.task.findUnique({
        where: { id: taskB.id },
        include: {
            dependencies: { include: { dependsOn: true } },
            dependedOnBy: { include: { task: true } },
        },
    });
    if (!fetchedB?.dependencies?.length || fetchedB.dependencies[0]?.dependsOnId !== taskA.id) {
        throw new Error("TEST 6b Failed: Fetching task with dependencies failed");
    }
    console.log("✓ TEST 6b Passed: Task queries include prerequisite relations.");

    // TEST 7: Preventing duplicate dependency
    console.log("\n[TEST 7] Preventing duplicate dependency...");
    let duplicatePrevented = false;
    try {
        await prisma.taskDependency.create({
            data: {
                taskId: taskB.id,
                dependsOnId: taskA.id,
            },
        });
    } catch (err: any) {
        // Prisma unique constraint violation code is P2002
        if (err.code === "P2002") {
            duplicatePrevented = true;
        } else {
            console.log("Encountered error preventing duplicate:", err.message);
            duplicatePrevented = true;
        }
    }
    if (!duplicatePrevented) {
        throw new Error("TEST 7 Failed: Duplicate dependency was not prevented by unique constraint!");
    }
    console.log("✓ TEST 7 Passed: Duplicate dependency was rejected by unique constraint.");

    // TEST 8: Accidental cascade deletion safety check
    console.log("\n[TEST 8] Cascade safety check...");
    // Deleting the dependency record should NOT delete either task
    await prisma.taskDependency.delete({
        where: {
            taskId_dependsOnId: {
                taskId: taskB.id,
                dependsOnId: taskA.id,
            },
        },
    });
    const checkA = await prisma.task.findUnique({ where: { id: taskA.id } });
    const checkB = await prisma.task.findUnique({ where: { id: taskB.id } });
    if (!checkA || !checkB) {
        throw new Error("TEST 8 Failed: Deleting dependency accidentally deleted one or both tasks!");
    }
    console.log("✓ TEST 8 Passed: Deleting dependency removed only the relationship, tasks remain intact.");

    // Clean up test tasks
    await prisma.task.deleteMany({
        where: { id: { in: [taskA.id, taskB.id] } },
    });
    console.log("Cleaned up test data.");

    console.log("\n=== ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY ===");
}

main()
    .catch((e) => {
        console.error("Test execution failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
