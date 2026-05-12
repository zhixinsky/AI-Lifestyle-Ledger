import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavingGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: {
      name: string;
      targetAmount: number;
      deadline?: string;
      icon?: string;
      color?: string;
    },
  ) {
    if (data.targetAmount <= 0) {
      throw new BadRequestException('目标金额必须大于0');
    }

    return this.prisma.savingGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        icon: data.icon || '🎯',
        color: data.color || '#00d4c8',
      },
    });
  }

  async list(userId: string) {
    const goals = await this.prisma.savingGoal.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    });

    return goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      return {
        ...g,
        targetAmount: target,
        currentAmount: current,
        remaining: Math.max(target - current, 0),
        percent: target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0,
        daysLeft: g.deadline
          ? Math.max(Math.ceil((g.deadline.getTime() - Date.now()) / 86400000), 0)
          : null,
      };
    });
  }

  async update(
    userId: string,
    goalId: string,
    data: {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      deadline?: string;
      icon?: string;
      color?: string;
    },
  ) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('目标不存在');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount;
    if (data.currentAmount !== undefined) updateData.currentAmount = data.currentAmount;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;

    const newCurrent = data.currentAmount ?? Number(goal.currentAmount);
    const newTarget = data.targetAmount ?? Number(goal.targetAmount);
    if (newCurrent >= newTarget && !goal.completed) {
      updateData.completed = true;
      updateData.completedAt = new Date();
    }

    return this.prisma.savingGoal.update({
      where: { id: goalId },
      data: updateData,
    });
  }

  async deposit(userId: string, goalId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('存入金额必须大于0');

    const goal = await this.prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('目标不存在');

    const newAmount = Number(goal.currentAmount) + amount;
    const target = Number(goal.targetAmount);
    const completed = newAmount >= target;

    return this.prisma.savingGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        completed,
        completedAt: completed && !goal.completed ? new Date() : goal.completedAt,
      },
    });
  }

  async remove(userId: string, goalId: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('目标不存在');

    return this.prisma.savingGoal.delete({ where: { id: goalId } });
  }
}
