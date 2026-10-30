import type { ErrorObject } from "ajv";
import type { Recurrence } from "@/types/data/Recurrence";
import validateDefault from "./default/Recurrence.js";

type RecurrenceValidator = {
  (data: unknown): data is Recurrence;
  errors?: ErrorObject[] | null;
};

const validateDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
};

const createError = (
  instancePath: string,
  message: string,
): ErrorObject => ({
  instancePath,
  schemaPath: "#/custom",
  keyword: "custom",
  params: {},
  message,
});

const validate: RecurrenceValidator = (data): data is Recurrence => {
  if (!validateDefault(data)) {
    validate.errors = validateDefault.errors;
    return false;
  }

  const recurrence = data as Recurrence;
  const errors: ErrorObject[] = [];

  if (!Number.isInteger(recurrence.interval) || recurrence.interval < 1) {
    errors.push(createError("/interval", "must be a positive integer"));
  }

  if (!validateDate(recurrence.startDate)) {
    errors.push(createError("/startDate", "must be a valid date in YYYY-MM-DD format"));
  }

  if (!validateDate(recurrence.endDate)) {
    errors.push(createError("/endDate", "must be a valid date in YYYY-MM-DD format"));
  }

  if (
    validateDate(recurrence.startDate) &&
    validateDate(recurrence.endDate) &&
    recurrence.startDate > recurrence.endDate
  ) {
    errors.push(createError("/endDate", "must not be earlier than startDate"));
  }

  if (recurrence.frequency === "weekly") {
    if (!Array.isArray(recurrence.weekdays) || recurrence.weekdays.length === 0) {
      errors.push(createError("/weekdays", "must contain at least one weekday for weekly recurrence"));
    } else {
      if (recurrence.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) {
        errors.push(createError("/weekdays", "each weekday must be an integer between 0 and 6"));
      }

      if (new Set(recurrence.weekdays).size !== recurrence.weekdays.length) {
        errors.push(createError("/weekdays", "must not contain duplicate weekdays"));
      }
    }

    if (recurrence.monthlyPattern !== undefined) {
      errors.push(createError("/monthlyPattern", "is only allowed for monthly recurrence"));
    }

    if (recurrence.month !== undefined) {
      errors.push(createError("/month", "is only allowed for annual recurrence"));
    }
  } else if (recurrence.frequency === "monthly") {
    if (recurrence.monthlyPattern === undefined) {
      errors.push(createError("/monthlyPattern", "is required for monthly recurrence"));
    } else if (recurrence.monthlyPattern.type === "date") {
      if (
        !Number.isInteger(recurrence.monthlyPattern.day) ||
        recurrence.monthlyPattern.day < 1 ||
        recurrence.monthlyPattern.day > 31
      ) {
        errors.push(createError("/monthlyPattern/day", "must be an integer between 1 and 31"));
      }
    } else if (recurrence.monthlyPattern.type === "weekday") {
      if (![1, 2, 3, 4, -1].includes(recurrence.monthlyPattern.ordinal)) {
        errors.push(createError("/monthlyPattern/ordinal", "must be 1, 2, 3, 4, or -1"));
      }

      if (
        !Number.isInteger(recurrence.monthlyPattern.weekday) ||
        recurrence.monthlyPattern.weekday < 0 ||
        recurrence.monthlyPattern.weekday > 6
      ) {
        errors.push(createError("/monthlyPattern/weekday", "must be an integer between 0 and 6"));
      }
    }

    if (recurrence.weekdays !== undefined) {
      errors.push(createError("/weekdays", "is only allowed for weekly recurrence"));
    }

    if (recurrence.month !== undefined) {
      errors.push(createError("/month", "is only allowed for annual recurrence"));
    }
  } else if (recurrence.frequency === "annually") {
    if (
      !Number.isInteger(recurrence.month) ||
      recurrence.month === undefined ||
      recurrence.month < 1 ||
      recurrence.month > 12
    ) {
      errors.push(createError("/month", "must be an integer between 1 and 12 for annual recurrence"));
    }

    if (recurrence.weekdays !== undefined) {
      errors.push(createError("/weekdays", "is only allowed for weekly recurrence"));
    }

    if (recurrence.monthlyPattern !== undefined) {
      errors.push(createError("/monthlyPattern", "is only allowed for monthly recurrence"));
    }
  } else {
    if (recurrence.weekdays !== undefined) {
      errors.push(createError("/weekdays", "is only allowed for weekly recurrence"));
    }

    if (recurrence.monthlyPattern !== undefined) {
      errors.push(createError("/monthlyPattern", "is only allowed for monthly recurrence"));
    }

    if (recurrence.month !== undefined) {
      errors.push(createError("/month", "is only allowed for annual recurrence"));
    }
  }

  validate.errors = errors.length > 0 ? errors : null;
  return errors.length === 0;
};

export default validate;