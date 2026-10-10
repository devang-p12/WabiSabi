import "dotenv/config";
import { generateAccessToken } from "../src/utils/jwt.js";
import { prisma } from "../src/config/prisma.js";

async function main() {
    console.log("=== RUNNING PHASE 4 HTTP API TESTS ===");

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
    if (!membership) throw new Error("No workspace membership found");

    const user = membership.user;
    const list = membership.workspace.boards.flatMap((b) => b.lists)[0];
    if (!list) throw new Error("No list found in user's workspace");

    const token = generateAccessToken(user.id);

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    const baseUrl = "http://localhost:3000/api/v1";

    // 1. Create Task 1 via API
    console.log("\n[API 1] Creating Task 1 with estimatedMinutes...");
    const res1 = await fetch(`${baseUrl}/lists/${list.id}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            title: "API Task 1",
            estimatedMinutes: 90,
        }),
    });
    const data1 = await res1.json();
    if (!res1.ok || data1.data?.task?.estimatedMinutes !== 90) {
        throw new Error(`API 1 Failed: ${JSON.stringify(data1)}`);
    }
    const task1 = data1.data.task;
    console.log(`✓ API 1 Passed: Created Task 1 (ID: ${task1.id}) with estimatedMinutes=90`);

    // 2. Create Task 2 via API
    console.log("\n[API 2] Creating Task 2...");
    const res2 = await fetch(`${baseUrl}/lists/${list.id}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            title: "API Task 2",
        }),
    });
    const data2 = await res2.json();
    if (!res2.ok) throw new Error(`API 2 Failed: ${JSON.stringify(data2)}`);
    const task2 = data2.data.task;
    console.log(`✓ API 2 Passed: Created Task 2 (ID: ${task2.id})`);

    // 3. Update Task 1 with actualMinutes, startedAt, completed
    console.log("\n[API 3] Updating Task 1 planning fields and completing it...");
    const res3 = await fetch(`${baseUrl}/tasks/${task1.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
            actualMinutes: 75,
            startedAt: new Date().toISOString(),
            completed: true,
        }),
    });
    const data3 = await res3.json();
    if (!res3.ok || data3.data?.task?.actualMinutes !== 75 || !data3.data?.task?.completedAt) {
        throw new Error(`API 3 Failed: ${JSON.stringify(data3)}`);
    }
    console.log("✓ API 3 Passed: Updated actualMinutes=75 and completed task sets completedAt.");

    // 4. Create dependency: Task 2 depends on Task 1
    console.log("\n[API 4] Creating dependency (Task 2 depends on Task 1)...");
    const res4 = await fetch(`${baseUrl}/tasks/${task2.id}/dependencies`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            dependsOnId: task1.id,
        }),
    });
    const data4 = await res4.json();
    const createdDep = data4.data?.dependency || data4.data;
    if (!res4.ok || createdDep?.dependsOnId !== task1.id) {
        throw new Error(`API 4 Failed: ${JSON.stringify(data4)}`);
    }
    console.log("✓ API 4 Passed: Dependency created successfully.");

    // 5. Duplicate dependency prevention
    console.log("\n[API 5] Attempting duplicate dependency creation...");
    const res5 = await fetch(`${baseUrl}/tasks/${task2.id}/dependencies`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            dependsOnId: task1.id,
        }),
    });
    const data5 = await res5.json();
    if (res5.status !== 409) {
        throw new Error(`API 5 Failed: Expected 409 status, got ${res5.status}: ${JSON.stringify(data5)}`);
    }
    console.log("✓ API 5 Passed: Duplicate dependency returned 409 Conflict as expected.");

    // 6. Self dependency prevention
    console.log("\n[API 6] Attempting self-dependency...");
    const res6 = await fetch(`${baseUrl}/tasks/${task2.id}/dependencies`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            dependsOnId: task2.id,
        }),
    });
    const data6 = await res6.json();
    if (res6.status !== 400) {
        throw new Error(`API 6 Failed: Expected 400 status, got ${res6.status}: ${JSON.stringify(data6)}`);
    }
    console.log("✓ API 6 Passed: Self-dependency returned 400 Bad Request as expected.");

    // 7. Get task dependencies
    console.log("\n[API 7] Fetching dependencies for Task 2...");
    const res7 = await fetch(`${baseUrl}/tasks/${task2.id}/dependencies`, {
        method: "GET",
        headers,
    });
    const data7 = await res7.json();
    if (!res7.ok || data7.data?.dependencies?.length !== 1) {
        throw new Error(`API 7 Failed: ${JSON.stringify(data7)}`);
    }
    console.log("✓ API 7 Passed: Fetched dependencies array correctly.");

    // 8. Delete dependency
    console.log("\n[API 8] Deleting dependency...");
    const res8 = await fetch(`${baseUrl}/tasks/${task2.id}/dependencies/${task1.id}`, {
        method: "DELETE",
        headers,
    });
    const data8 = await res8.json();
    if (!res8.ok) throw new Error(`API 8 Failed: ${JSON.stringify(data8)}`);
    console.log("✓ API 8 Passed: Dependency deleted successfully.");

    // Clean up
    await prisma.task.deleteMany({
        where: { id: { in: [task1.id, task2.id] } },
    });
    console.log("Cleaned up test tasks.");

    console.log("\n=== ALL PHASE 4 HTTP API TESTS PASSED! ===");
}

main()
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
