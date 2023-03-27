import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import {
  isValidName as _isValidName,
  isValidIdentifier as _isValidIdentifier,
} from './names-identifiers-parser';

export function IsNotBlank(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsNotBlank',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate: (value: any): boolean => {
          if (typeof value !== 'string') {
            return false;
          }
          const s = value as string;
          return !!s && s.trim().length > 0;
        },
        defaultMessage: (validationArguments?: ValidationArguments): string =>
          `${validationArguments?.property} should not be blank`,
      },
    });
  };
}

export function IsValidName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate: (value: any): boolean => {
          if (typeof value !== 'string') {
            return false;
          }
          const s = value as string;
          return !!s && s.trim().length > 0 && _isValidName(s);
        },
        defaultMessage: (validationArguments?: ValidationArguments): string =>
          `${validationArguments?.property} contains invalid characters, is not a valid name.`,
      },
    });
  };
}

export function IsValidIdentifier(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidIdentifier',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate: (value: any): boolean => {
          if (typeof value !== 'string') {
            return false;
          }
          const s = value as string;
          return !!s && s.trim().length > 0 && _isValidIdentifier(s);
        },
        defaultMessage: (validationArguments?: ValidationArguments): string =>
          `${validationArguments?.property} contains invalid characters, is not a valid identifier.`,
      },
    });
  };
}
