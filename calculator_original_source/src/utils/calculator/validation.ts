// Централизованная система валидации

import React from 'react';
import { RoomData, Opening, ExclusionZone, GeometricElement, SavedMaterial, Unit } from '../types';

// Базовые типы для валидации
export interface ValidationRule<T = unknown> {
  validate: (value: T) => ValidationResult;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ValidationSchema<T = unknown> {
  [K in keyof T]?: ValidationRule<T[K]>[];
}

// Базовые правила валидации
export class ValidationRules {
  static required(message = 'Поле обязательно для заполнения'): ValidationRule<string> {
    return {
      validate: (value: string) => ({
        isValid: value !== null && value !== undefined && value.trim() !== '',
        error: value === null || value === undefined || value.trim() === '' ? message : undefined
      }),
      message
    };
  }

  static minLength(min: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => ({
        isValid: value.length >= min,
        error: value.length < min ? (message || `Минимальная длина: ${min} символов`) : undefined
      }),
      message: message || `Минимальная длина: ${min} символов`
    };
  }

  static maxLength(max: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => ({
        isValid: value.length <= max,
        error: value.length > max ? (message || `Максимальная длина: ${max} символов`) : undefined
      }),
      message: message || `Максимальная длина: ${max} символов`
    };
  }

  static number(min?: number, max?: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => {
        const num = parseFloat(value.replace(',', '.'));
        if (isNaN(num)) {
          return { isValid: false, error: message || 'Введите корректное число' };
        }
        if (min !== undefined && num < min) {
          return { isValid: false, error: message || `Значение должно быть не менее ${min}` };
        }
        if (max !== undefined && num > max) {
          return { isValid: false, error: message || `Значение должно быть не более ${max}` };
        }
        return { isValid: true };
      },
      message: message || 'Введите корректное число'
    };
  }

  static positiveNumber(message?: string): ValidationRule<string> {
    return ValidationRules.number(0, undefined, message || 'Значение должно быть положительным');
  }

  static integer(min?: number, max?: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
          return { isValid: false, error: message || 'Введите целое число' };
        }
        if (min !== undefined && num < min) {
          return { isValid: false, error: message || `Значение должно быть не менее ${min}` };
        }
        if (max !== undefined && num > max) {
          return { isValid: false, error: message || `Значение должно быть не более ${max}` };
        }
        return { isValid: true };
      },
      message: message || 'Введите целое число'
    };
  }

  static email(message?: string): ValidationRule<string> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      validate: (value: string) => ({
        isValid: emailRegex.test(value),
        error: !emailRegex.test(value) ? (message || 'Введите корректный email') : undefined
      }),
      message: message || 'Введите корректный email'
    };
  }

  static oneOf<T>(values: T[], message?: string): ValidationRule<T> {
    return {
      validate: (value: T) => ({
        isValid: values.includes(value),
        error: !values.includes(value) ? (message || `Значение должно быть одним из: ${values.join(', ')}`) : undefined
      }),
      message: message || `Значение должно быть одним из: ${values.join(', ')}`
    };
  }

  static custom<T>(validator: (value: T) => boolean, message: string): ValidationRule<T> {
    return {
      validate: (value: T) => ({
        isValid: validator(value),
        error: !validator(value) ? message : undefined
      }),
      message
    };
  }
}

// Схемы валидации для основных типов
export const RoomValidationSchema: ValidationSchema<RoomData> = {
  name: [
    ValidationRules.required('Название комнаты обязательно'),
    ValidationRules.minLength(1, 'Название не может быть пустым'),
    ValidationRules.maxLength(100, 'Название слишком длинное')
  ],
  length: [
    ValidationRules.required('Длина обязательна'),
    ValidationRules.number(0.01, 100, 'Длина должна быть от 0.01 до 100 метров')
  ],
  width: [
    ValidationRules.required('Ширина обязательна'),
    ValidationRules.number(0.01, 100, 'Ширина должна быть от 0.01 до 100 метров')
  ],
  height: [
    ValidationRules.required('Высота обязательна'),
    ValidationRules.number(0.01, 10, 'Высота должна быть от 0.01 до 10 метров')
  ],
  unit: [
    ValidationRules.oneOf(['m', 'cm'] as Unit[], 'Единица измерения должна быть м или см')
  ],
  notes: [
    ValidationRules.maxLength(1000, 'Заметки слишком длинные')
  ]
};

export const OpeningValidationSchema: ValidationSchema<Opening> = {
  width: [
    ValidationRules.required('Ширина проема обязательна'),
    ValidationRules.number(0.01, 10, 'Ширина должна быть от 0.01 до 10 метров')
  ],
  height: [
    ValidationRules.required('Высота проема обязательна'),
    ValidationRules.number(0.01, 5, 'Высота должна быть от 0.01 до 5 метров')
  ],
  count: [
    ValidationRules.required('Количество обязательное'),
    ValidationRules.integer(1, 20, 'Количество должно быть от 1 до 20')
  ],
  type: [
    ValidationRules.oneOf(['window', 'door'], 'Тип должен быть окно или дверь')
  ],
  sillHeight: [
    ValidationRules.number(0, 2, 'Высота подоконника должна быть от 0 до 2 метров')
  ]
};

export const ExclusionValidationSchema: ValidationSchema<ExclusionZone> = {
  name: [
    ValidationRules.required('Название исключения обязательно'),
    ValidationRules.minLength(1, 'Название не может быть пустым'),
    ValidationRules.maxLength(100, 'Название слишком длинное')
  ],
  width: [
    ValidationRules.required('Ширина обязательна'),
    ValidationRules.number(0.01, 10, 'Ширина должна быть от 0.01 до 10 метров')
  ],
  height: [
    ValidationRules.required('Высота обязательна'),
    ValidationRules.number(0.01, 5, 'Высота должна быть от 0.01 до 5 метров')
  ],
  count: [
    ValidationRules.required('Количество обязательное'),
    ValidationRules.integer(1, 20, 'Количество должно быть от 1 до 20')
  ]
};

export const GeometricElementValidationSchema: ValidationSchema<GeometricElement> = {
  type: [
    ValidationRules.oneOf(['niche', 'protrusion', 'column'], 'Тип должен быть ниша, выступ или колонна')
  ],
  width: [
    ValidationRules.number(0, 10, 'Ширина должна быть от 0 до 10 метров')
  ],
  depth: [
    ValidationRules.number(0, 5, 'Глубина должна быть от 0 до 5 метров')
  ],
  diameter: [
    ValidationRules.number(0, 2, 'Диаметр должен быть от 0 до 2 метров')
  ],
  height: [
    ValidationRules.required('Высота обязательна'),
    ValidationRules.number(0.01, 10, 'Высота должна быть от 0.01 до 10 метров')
  ],
  count: [
    ValidationRules.required('Количество обязательное'),
    ValidationRules.integer(1, 20, 'Количество должно быть от 1 до 20')
  ]
};

export const SavedMaterialValidationSchema: ValidationSchema<SavedMaterial> = {
  name: [
    ValidationRules.required('Название материала обязательно'),
    ValidationRules.minLength(1, 'Название не может быть пустым'),
    ValidationRules.maxLength(100, 'Название слишком длинное')
  ],
  category: [
    ValidationRules.oneOf(['plaster', 'putty', 'paint', 'wallpaper', 'tile', 'flooring', 'screed', 'skirting', 'drywall'], 'Неверная категория материала')
  ]
};

// Валидатор
export class Validator<T = unknown> {
  private schema: ValidationSchema<T>;

  constructor(schema: ValidationSchema<T>) {
    this.schema = schema;
  }

  validate(data: T): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(this.schema)) {
      if (!rules) continue;

      const value = (data as any)[field];
      const fieldErrors: string[] = [];

      for (const rule of rules) {
        const result = rule.validate(value);
        if (!result.isValid && result.error) {
          fieldErrors.push(result.error);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return { isValid, errors };
  }

  validateField(field: keyof T, value: unknown): ValidationResult {
    const rules = this.schema[field];
    if (!rules) return { isValid: true };

    for (const rule of rules) {
      const result = rule.validate(value);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }
}

// Готовые валидаторы
export const roomValidator = new Validator(RoomValidationSchema);
export const openingValidator = new Validator(OpeningValidationSchema);
export const exclusionValidator = new Validator(ExclusionValidationSchema);
export const geometricElementValidator = new Validator(GeometricElementValidationSchema);
export const savedMaterialValidator = new Validator(SavedMaterialValidationSchema);

// Утилиты для валидации
export const validateRoom = (room: RoomData) => roomValidator.validate(room);
export const validateOpening = (opening: Opening) => openingValidator.validate(opening);
export const validateExclusion = (exclusion: ExclusionZone) => exclusionValidator.validate(exclusion);
export const validateGeometricElement = (element: GeometricElement) => geometricElementValidator.validate(element);
export const validateSavedMaterial = (material: SavedMaterial) => savedMaterialValidator.validate(material);

// Валидация всего проекта
export const validateProject = (rooms: RoomData[]): { isValid: boolean; errors: Record<string, unknown> } => {
  const errors: Record<string, unknown> = {};
  let isValid = true;

  rooms.forEach((room, roomIndex) => {
    const roomValidation = validateRoom(room);
    if (!roomValidation.isValid) {
      errors[`room_${roomIndex}`] = roomValidation.errors;
      isValid = false;
    }

    // Валидация проемов
    room.openings.forEach((opening, openingIndex) => {
      const openingValidation = validateOpening(opening);
      if (!openingValidation.isValid) {
        errors[`room_${roomIndex}_opening_${openingIndex}`] = openingValidation.errors;
        isValid = false;
      }
    });

    // Валидация исключений
    room.exclusions.forEach((exclusion, exclusionIndex) => {
      const exclusionValidation = validateExclusion(exclusion);
      if (!exclusionValidation.isValid) {
        errors[`room_${roomIndex}_exclusion_${exclusionIndex}`] = exclusionValidation.errors;
        isValid = false;
      }
    });

    // Валидация геометрических элементов
    room.geometricElements.forEach((element, elementIndex) => {
      const elementValidation = validateGeometricElement(element);
      if (!elementValidation.isValid) {
        errors[`room_${roomIndex}_element_${elementIndex}`] = elementValidation.errors;
        isValid = false;
      }
    });
  });

  return { isValid, errors };
};

// Хук для валидации в React компонентах
export const useValidation = <T>(schema: ValidationSchema<T>) => {
  const validator = React.useMemo(() => new Validator(schema), [schema]);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  const validate = React.useCallback((data: T) => {
    const result = validator.validate(data);
    setErrors(result.errors);
    return result.isValid;
  }, [validator]);

  const validateField = React.useCallback((field: keyof T, value: unknown) => {
    const result = validator.validateField(field, value);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, [field as string]: [result.error!] }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
    return result.isValid;
  }, [validator]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = React.useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    isValid: Object.keys(errors).length === 0
  };
};
