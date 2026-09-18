import { prisma } from "../../config/prisma.js";

import type { CreateLabelInput,UpdateLabelInput } from "./label.validation.js";

export const getBoardLabels = async (
    boardId: string,
) => {
    return prisma.label.findMany({
        where: {
            boardId,
        },
        orderBy: {
            name: "asc",
        },
    });
};

export const createLabel = async (
    boardId: string,
    data: CreateLabelInput,
) => {
    return prisma.label.create({
        data: {
            name: data.name,
            color: data.color,
            boardId,
        },
    });
};

export const updateLabel = async (
    labelId: string,
    data: UpdateLabelInput,
) => {
    return prisma.label.update({
        where: {
            id: labelId,
        },
        data: {
            ...(data.name !== undefined && {
                name: data.name,
            }),
            ...(data.color !== undefined && {
                color: data.color,
            }),
        },
    });
};

export const deleteLabel = async (
    labelId: string,
) => {
    return prisma.label.delete({
        where: {
            id: labelId,
        },
    });
};

export const addLabelToTask = async (
    taskId: string,
    labelId: string,
) => {
    return prisma.taskLabel.create({
        data: {
            taskId,
            labelId,
        },
        include: {
            label: true,
        },
    });
};

export const removeLabelFromTask = async (
    taskId: string,
    labelId: string,
) => {
    return prisma.taskLabel.delete({
        where: {
            taskId_labelId: {
                taskId,
                labelId,
            },
        },
    });
};

