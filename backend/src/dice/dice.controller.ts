import { Controller, Post, Body } from '@nestjs/common';
import { DiceService, RollResult, CheckResult } from './dice.service';

@Controller('dice')
export class DiceController {
  constructor(private readonly dice: DiceService) {}

  @Post('roll')
  async roll(@Body() body: { count: number; sides: number; modifier?: number }) {
    return { results: this.dice.roll(body.count, body.sides, body.modifier) };
  }

  @Post('attributes')
  async rollAttributes(@Body() body?: { method: 'standard' | 'point_buy'; pointTotal?: number }) {
    if (body?.method === 'point_buy') {
      return { method: 'point_buy', pointTotal: body.pointTotal || 460 };
    }
    return {
      method: 'standard',
      sets: Array.from({ length: 5 }, () => ({
        str: this.dice.rollAttribute('3d6'),
        con: this.dice.rollAttribute('3d6'),
        siz: this.dice.rollAttribute('3d6'),
        dex: this.dice.rollAttribute('3d6'),
        app: this.dice.rollAttribute('3d6'),
        int: this.dice.rollAttribute('2d6+6'),
        pow: this.dice.rollAttribute('3d6'),
        edu: this.dice.rollAttribute('2d6+6'),
        luck: this.dice.rollAttribute('3d6'),
      })),
    };
  }

  @Post('check')
  async skillCheck(@Body() body: {
    targetValue: number;
    bonusDice?: number;
    penaltyDice?: number;
    luckSpent?: number;
  }): Promise<CheckResult> {
    return this.dice.skillCheck(body.targetValue, body.bonusDice, body.penaltyDice, body.luckSpent);
  }

  @Post('luck')
  async luckCheck(@Body() body: { luck: number }) {
    return this.dice.luckCheck(body.luck);
  }

  @Post('san')
  async sanCheck(@Body() body: { currentSan: number; loss: string }) {
    return this.dice.sanCheck(body.currentSan, body.loss);
  }
}
