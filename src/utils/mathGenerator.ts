import { Question, QuestionGroup, QuestionTerm, QuizConfig } from '../types/quiz';

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
 * Generates a vertical mental math question with multiple rows.
 * Exactly ONE row is subtraction (isNegative = true).
 * The subtracted number is strictly smaller than the number directly above it.
 * All other rows are positive addition.
 */
export function generateSingleQuestion(
  numbersCount: number = 3,
  digitsCount: number = 2,
  groupId?: string,
  groupLabel?: string
): Question {
  const safeNumbersCount = Math.max(2, Math.min(10, Math.round(numbersCount) || 3));
  const safeDigitsCount = Math.max(1, Math.min(6, Math.round(digitsCount) || 2));
  const range = getRangeForDigits(safeDigitsCount);

  // Pick exactly ONE row to be the subtraction row (must be index >= 1, so it has a number above it)
  const minusIndex = getRandomInt(1, safeNumbersCount - 1);

  const terms: QuestionTerm[] = [];

  for (let i = 0; i < safeNumbersCount; i++) {
    if (i === minusIndex - 1) {
      // The row directly above the subtraction row: ensure it's high enough so the subtracted number can be smaller
      const minAbove = safeDigitsCount === 1 
        ? getRandomInt(3, 9) 
        : getRandomInt(range.min + Math.max(5, Math.floor((range.max - range.min) * 0.2)), range.max);
      terms.push({
        value: minAbove,
        isNegative: false,
      });
    } else if (i === minusIndex) {
      // The subtraction row: MUST be strictly smaller than terms[minusIndex - 1]
      const aboveValue = terms[minusIndex - 1].value;
      const minMinus = safeDigitsCount === 1 ? 1 : Math.max(range.min, 1);
      
      let minusValue: number;
      if (aboveValue > minMinus) {
        minusValue = getRandomInt(minMinus, aboveValue - 1);
      } else {
        // Fallback safety: adjust aboveValue and minusValue
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

  // Calculate final correct answer: sum of positive rows minus the single negative row
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
  };
}

export function generateQuizQuestions(config: QuizConfig): Question[] {
  const allQuestions: Question[] = [];
  const groups = config.groups && config.groups.length > 0
    ? config.groups
    : [
        {
          id: 'grp_default',
          numbersCount: 3,
          digitsCount: 2,
          questionCount: 10,
        },
      ];

  groups.forEach((group: QuestionGroup, groupIdx: number) => {
    const targetCount = Math.max(1, group.questionCount || 5);
    const label = `Section ${groupIdx + 1}: ${group.numbersCount} Rows · ${group.digitsCount} Digits`;

    const groupQuestions: Question[] = [];

    for (let i = 0; i < targetCount; i++) {
      groupQuestions.push(
        generateSingleQuestion(
          group.numbersCount,
          group.digitsCount,
          group.id,
          label
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
