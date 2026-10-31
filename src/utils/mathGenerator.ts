import { FormulaType, Question, QuestionGroup, QuestionTerm, QuizConfig } from '../types/quiz';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRangeForDigits(digits: number): { min: number; max: number } {
  if (digits <= 1) {
    return { min: 1, max: 9 };
  }
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return { min, max };
}

/**
 * Returns human-readable Arabic & English label for formula types
 */
export function getFormulaTypeLabel(type?: FormulaType): string {
  switch (type) {
    case 'simple':
      return 'معادلات بسيطة (Direct Simple)';
    case 'five':
      return 'معادلات الـ 5 (Small Friends)';
    case 'normal':
    default:
      return 'معادلات عادية (Standard)';
  }
}

/**
 * Abacus Bead Direct Rule:
 * In a single column (0-9):
 * 1 upper bead (value 5), 4 lower beads (value 1 each).
 * Direct Add: no carry into 5 or 10, uses available lower/upper beads directly.
 */
function isDirectAdd(d: number, v: number): boolean {
  if (v <= 0 || v > 9) return false;
  if (d + v > 9) return false;
  const u = d >= 5 ? 1 : 0;
  const l = d % 5;
  if (v < 5) return l + v <= 4;
  if (u === 1) return false; // upper bead already active, cannot add 5 directly
  return l + (v - 5) <= 4;
}

/**
 * Direct Sub: no borrow from 5 or 10, uses available lower/upper beads directly.
 */
function isDirectSub(d: number, v: number): boolean {
  if (v <= 0 || v > 9) return false;
  if (d - v < 0) return false;
  const u = d >= 5 ? 1 : 0;
  const l = d % 5;
  if (v < 5) return l >= v;
  if (u === 0) return false; // upper bead not active, cannot subtract 5 directly
  return l >= (v - 5);
}

/**
 * 5-Complement (Small Friends) Addition Rule:
 * +v where v in [1..4]: formula +v = +5 - (5 - v)
 * Requires upper bead (5) to be currently free (u === 0),
 * lower beads not enough to add directly (l + v > 4),
 * and sufficient lower beads to subtract the friend: l >= (5 - v).
 */
function isFiveFriendAdd(d: number, v: number): boolean {
  if (v < 1 || v > 4) return false;
  if (d + v > 9) return false;
  const u = d >= 5 ? 1 : 0;
  if (u === 1) return false;
  const l = d % 5;
  if (l + v <= 4) return false; // direct, not a 5-friend
  const friend = 5 - v;
  return l >= friend;
}

/**
 * 5-Complement (Small Friends) Subtraction Rule:
 * -v where v in [1..4]: formula -v = -(5) + (5 - v)
 * Requires upper bead (5) to be currently active (u === 1),
 * lower beads not enough to subtract directly (l < v),
 * and sufficient space on lower beads to add the friend: l + (5 - v) <= 4.
 */
function isFiveFriendSub(d: number, v: number): boolean {
  if (v < 1 || v > 4) return false;
  if (d - v < 0) return false;
  const u = d >= 5 ? 1 : 0;
  if (u === 0) return false;
  const l = d % 5;
  if (l >= v) return false; // direct, not a 5-friend
  const friend = 5 - v;
  return l + friend <= 4;
}

/**
 * Generates terms for "simple" or "five" formulas digit-by-digit
 * keeping running digits within valid Abacus beads and respecting the 1-subtraction rule.
 */
function generateAbacusFormulaTerms(
  numbersCount: number,
  digitsCount: number,
  formulaType: 'simple' | 'five'
): QuestionTerm[] | null {
  for (let attempt = 0; attempt < 60; attempt++) {
    const minusIndex = getRandomInt(1, numbersCount - 1);
    const terms: QuestionTerm[] = [];
    let currentDigits: number[] = [];
    let hasFiveFormula = false;
    let failed = false;

    // First term
    const firstTermDigits: number[] = [];
    for (let c = 0; c < digitsCount; c++) {
      const minD = c === 0 && digitsCount > 1 ? 1 : 1;
      // For simple/five, choose a clean starting digit
      const d = formulaType === 'five' ? getRandomInt(1, 8) : getRandomInt(minD, 9);
      firstTermDigits.push(d);
    }
    const firstVal = Number(firstTermDigits.join(''));
    terms.push({ value: firstVal, isNegative: false });
    currentDigits = [...firstTermDigits];

    // Subsequent terms
    for (let i = 1; i < numbersCount; i++) {
      const isMinus = i === minusIndex;
      const nextTermDigits: number[] = [];

      for (let c = 0; c < digitsCount; c++) {
        const curD = currentDigits[c];
        interface ValidMove {
          val: number;
          isFive: boolean;
        }
        const validMoves: ValidMove[] = [];

        for (let v = 0; v <= 9; v++) {
          if (c === 0 && digitsCount > 1 && v === 0) continue; // no leading zero
          if (digitsCount === 1 && v === 0) continue;

          if (isMinus) {
            if (formulaType === 'simple') {
              if (isDirectSub(curD, v)) validMoves.push({ val: v, isFive: false });
            } else {
              // five: allow 5-friend sub or direct sub
              if (isFiveFriendSub(curD, v)) validMoves.push({ val: v, isFive: true });
              else if (isDirectSub(curD, v)) validMoves.push({ val: v, isFive: false });
            }
          } else {
            if (formulaType === 'simple') {
              if (isDirectAdd(curD, v)) validMoves.push({ val: v, isFive: false });
            } else {
              // five: allow 5-friend add or direct add
              if (isFiveFriendAdd(curD, v)) validMoves.push({ val: v, isFive: true });
              else if (isDirectAdd(curD, v)) validMoves.push({ val: v, isFive: false });
            }
          }
        }

        if (validMoves.length === 0) {
          failed = true;
          break;
        }

        // For 'five', prioritize 5-friend moves if we haven't encountered one yet
        let chosen: ValidMove;
        const fiveMoves = validMoves.filter((m) => m.isFive);
        if (formulaType === 'five' && !hasFiveFormula && fiveMoves.length > 0 && Math.random() < 0.75) {
          chosen = fiveMoves[getRandomInt(0, fiveMoves.length - 1)];
        } else {
          chosen = validMoves[getRandomInt(0, validMoves.length - 1)];
        }

        if (chosen.isFive) hasFiveFormula = true;
        nextTermDigits.push(chosen.val);
      }

      if (failed) break;

      const nextVal = Number(nextTermDigits.join(''));
      if (nextVal <= 0) {
        failed = true;
        break;
      }

      // Strictly smaller rule: subtracted row MUST be smaller than the number directly above it
      if (isMinus && nextVal >= terms[i - 1].value) {
        failed = true;
        break;
      }

      terms.push({ value: nextVal, isNegative: isMinus });

      // Update currentDigits
      for (let c = 0; c < digitsCount; c++) {
        if (isMinus) currentDigits[c] -= nextTermDigits[c];
        else currentDigits[c] += nextTermDigits[c];
      }
    }

    if (!failed) {
      if (formulaType === 'five' && !hasFiveFormula) {
        continue; // retry to ensure the question actually contains 5-formula moves
      }
      return terms;
    }
  }

  return null;
}

/**
 * Standard / Normal generator (معادلات عادية زي الوقتي)
 * Generates multi-row vertical mental math with exactly 1 subtraction row
 * strictly smaller than the row directly above it.
 */
function generateNormalTerms(
  numbersCount: number,
  digitsCount: number
): QuestionTerm[] {
  const range = getRangeForDigits(digitsCount);
  const minusIndex = getRandomInt(1, numbersCount - 1);
  const terms: QuestionTerm[] = [];

  for (let i = 0; i < numbersCount; i++) {
    if (i === minusIndex - 1) {
      // Row above subtraction: ensure value is high enough
      const minAbove =
        digitsCount === 1
          ? getRandomInt(3, 9)
          : getRandomInt(
              range.min + Math.max(5, Math.floor((range.max - range.min) * 0.2)),
              range.max
            );
      terms.push({
        value: minAbove,
        isNegative: false,
      });
    } else if (i === minusIndex) {
      // Subtraction row: strictly smaller than row above it
      const aboveValue = terms[minusIndex - 1].value;
      const minMinus = digitsCount === 1 ? 1 : Math.max(range.min, 1);

      let minusValue: number;
      if (aboveValue > minMinus) {
        minusValue = getRandomInt(minMinus, aboveValue - 1);
      } else {
        terms[minusIndex - 1].value = aboveValue + 10;
        minusValue = getRandomInt(minMinus, aboveValue + 9);
      }

      terms.push({
        value: minusValue,
        isNegative: true,
      });
    } else {
      // Regular addition row
      const val = getRandomInt(range.min, range.max);
      terms.push({
        value: val,
        isNegative: false,
      });
    }
  }

  return terms;
}

/**
 * Generates a vertical mental math question with multiple rows.
 * Exactly ONE row is subtraction (isNegative = true).
 * The subtracted number is strictly smaller than the number directly above it.
 * All other rows are positive addition.
 *
 * Supports Formula Types:
 * - 'simple': Direct addition and subtraction on bead columns (معادلات بسيطة)
 * - 'five': Small Friends / 5-Complements formulas (+5 / -5) (معادلات الـ 5)
 * - 'normal': Standard mixed arithmetic (معادلات عادية زي الوقتي)
 */
export function generateSingleQuestion(
  numbersCount: number = 3,
  digitsCount: number = 2,
  groupId?: string,
  groupLabel?: string,
  formulaType: FormulaType = 'normal'
): Question {
  const safeNumbersCount = Math.max(2, Math.min(10, Math.round(numbersCount) || 3));
  const safeDigitsCount = Math.max(1, Math.min(5, Math.round(digitsCount) || 2));

  let terms: QuestionTerm[] | null = null;

  if (formulaType === 'simple' || formulaType === 'five') {
    terms = generateAbacusFormulaTerms(safeNumbersCount, safeDigitsCount, formulaType);
  }

  // Fallback to normal if abacus constraints couldn't be satisfied or formulaType === 'normal'
  if (!terms) {
    terms = generateNormalTerms(safeNumbersCount, safeDigitsCount);
  }

  // Calculate final correct answer: sum of positive rows minus negative row
  let correctAnswer = 0;
  for (const term of terms) {
    if (term.isNegative) {
      correctAnswer -= term.value;
    } else {
      correctAnswer += term.value;
    }
  }

  const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    terms,
    correctAnswer,
    numbersCount: safeNumbersCount,
    digitsCount: safeDigitsCount,
    groupId,
    groupLabel,
    formulaType,
  };
}

export function generateQuizQuestions(config: QuizConfig): Question[] {
  const allQuestions: Question[] = [];
  const groups =
    config.groups && config.groups.length > 0
      ? config.groups
      : [
          {
            id: 'grp_default',
            numbersCount: 3,
            digitsCount: 2,
            questionCount: 10,
            formulaType: 'normal' as FormulaType,
          },
        ];

  groups.forEach((group: QuestionGroup, groupIdx: number) => {
    const targetCount = Math.max(1, group.questionCount || 5);
    const fType = group.formulaType || 'normal';
    const fName =
      fType === 'simple'
        ? 'بسيطة'
        : fType === 'five'
        ? 'معادلات 5'
        : 'عادية';
    const label = `Section ${groupIdx + 1}: ${group.numbersCount} Rows · ${group.digitsCount} Digits (${fName})`;

    const groupQuestions: Question[] = [];

    for (let i = 0; i < targetCount; i++) {
      groupQuestions.push(
        generateSingleQuestion(
          group.numbersCount,
          group.digitsCount,
          group.id,
          label,
          fType
        )
      );
    }

    allQuestions.push(...groupQuestions);
  });

  return allQuestions;
}

/**
 * Formats a question into a readable math expression string (e.g. "45 + 23 - 12 + 31")
 */
export function formatQuestionInline(terms: QuestionTerm[]): string {
  return terms
    .map((term, idx) => {
      if (idx === 0) {
        return `${term.value}`;
      }
      return term.isNegative ? `- ${term.value}` : `+ ${term.value}`;
    })
    .join(' ');
}
