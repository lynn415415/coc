import { Injectable } from '@nestjs/common';

export interface RawDice {
  tensDigits: number[];
  onesDigit: number;
  keptTensIndex: number;
  bonusDice: number;
  penaltyDice: number;
}

export interface CheckResult {
  roll: number;
  targetValue: number;
  isSuccess: boolean;
  isCriticalSuccess: boolean;
  isFumble: boolean;
  successLevel: 'critical' | 'success' | 'failure' | 'fumble';
  description: string;
  rawDice?: RawDice;
}

export interface RollResult {
  value: number;
  isCritical: boolean;
  isFumble: boolean;
}

@Injectable()
export class DiceService {
  private rng = () => Math.random();

  roll(count: number, sides: number, modifier = 0): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(this.rng() * sides) + 1);
    }
    if (modifier) results.push(modifier);
    return results;
  }

  rollSum(count: number, sides: number, modifier = 0): number {
    let sum = modifier;
    for (let i = 0; i < count; i++) {
      sum += Math.floor(this.rng() * sides) + 1;
    }
    return sum;
  }

  rollAttribute(formula: string): number {
    const match = formula.match(/(\d+)d6\+?(\d*)/i);
    if (!match) return 50;
    const count = parseInt(match[1]);
    const modifier = parseInt(match[2] || '0');
    return this.rollSum(count, 6, modifier) * 5;
  }

  d100(): RollResult {
    const value = Math.floor(this.rng() * 100) + 1;
    return {
      value,
      isCritical: false,
      isFumble: false,
    };
  }

  skillCheck(targetValue: number, bonusDice = 0, penaltyDice = 0, luckSpent = 0): CheckResult {
    let roll = this.d100().value;
    const effectiveTarget = targetValue + luckSpent;
    let rawDice: RawDice | undefined;

    // 奖励/惩罚骰
    if (bonusDice > 0 || penaltyDice > 0) {
      const extraDice = bonusDice - penaltyDice;
      const tensDigit = Math.floor(roll / 10);
      const onesDigit = roll % 10;
      const tensDigits: number[] = [tensDigit];
      let bestTens = tensDigit;
      let worstTens = tensDigit;
      let keptTensIndex = 0;

      for (let i = 0; i < Math.abs(extraDice); i++) {
        const extraTens = Math.floor(this.rng() * 10);
        tensDigits.push(extraTens);
        if (extraTens < bestTens) {
          bestTens = extraTens;
          if (extraDice > 0) keptTensIndex = tensDigits.length - 1;
        }
        if (extraTens > worstTens) {
          worstTens = extraTens;
          if (extraDice < 0) keptTensIndex = tensDigits.length - 1;
        }
      }

      const finalTens = extraDice > 0 ? bestTens : worstTens;
      roll = finalTens * 10 + onesDigit;
      if (roll === 0) roll = 100;

      rawDice = {
        tensDigits,
        onesDigit,
        keptTensIndex,
        bonusDice,
        penaltyDice,
      };
    }

    const fifth = Math.floor(effectiveTarget / 5);
    const isCriticalSuccess = roll <= fifth && roll <= 100;
    const isSuccess = roll <= effectiveTarget;
    const isFumble = effectiveTarget < 50 ? roll === 100 : roll >= 96;

    let successLevel: CheckResult['successLevel'] = 'failure';
    let description = '失败';

    if (isCriticalSuccess) {
      successLevel = 'critical';
      description = '大成功';
    } else if (isSuccess) {
      successLevel = 'success';
      description = roll <= Math.floor(effectiveTarget / 2) ? '困难成功' : '成功';
    } else if (isFumble) {
      successLevel = 'fumble';
      description = '大失败';
    }

    return {
      roll,
      targetValue: effectiveTarget,
      isSuccess: isSuccess || isCriticalSuccess,
      isCriticalSuccess,
      isFumble,
      successLevel,
      description,
      rawDice,
    };
  }

  luckCheck(luck: number): CheckResult {
    return this.skillCheck(luck);
  }

  sanCheck(currentSan: number, loss: string): CheckResult {
    const result = this.skillCheck(currentSan);
    if (!result.isSuccess) {
      const match = loss.match(/(\d+)d(\d+)/);
      if (match) {
        const lossResult = this.rollSum(parseInt(match[1]), parseInt(match[2]));
        (result as any).sanLoss = lossResult;
      } else {
        (result as any).sanLoss = parseInt(loss) || 1;
      }
    } else {
      (result as any).sanLoss = 0;
    }
    return result;
  }
}
