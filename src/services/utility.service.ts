import { Injectable } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import * as dayjs from 'dayjs';

@Injectable()
export class UtilityService {
  public globalResponse<T>({ statusCode = 200, message = null, data = null }: { data?: T; message?: string; statusCode?: number }) {
    return { statusCode, message, data };
  }

  public comparePassword(password: string, hashed: string): boolean {
    return bcryptjs.compareSync(password, hashed);
  }

  public generateId() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }

    return `${dayjs().unix()}${result}`;
  }

  public validatePassword(password: string): string | null {
    // Regular expressions for password validation
    const minLength = 8;
    // const upperCaseRegex = /[A-Z]/;
    const lowerCaseRegex = /[a-z]/;
    const digitRegex = /\d/;
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

    // Check for minimum length
    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }

    // Check for uppercase letter
    // if (!upperCaseRegex.test(password)) {
    //   return 'Password must contain at least one uppercase letter';
    // }

    // Check for lowercase letter
    if (!lowerCaseRegex.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    // Check for digit
    if (!digitRegex.test(password)) {
      return 'Password must contain at least one digit';
    }

    // Check for special character
    if (!specialCharRegex.test(password)) {
      return 'Password must contain at least one special character ($@$!%*?&)';
    }

    return null;
  }

  public hashPassword(password: string): string {
    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(password, salt);
    return hash;
  }
}
