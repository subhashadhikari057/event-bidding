import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class Environment {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  FRONTEND_URL = 'http://localhost:3000';

  @IsUrl({ protocols: ['postgresql', 'postgres'], require_protocol: true, require_tld: false })
  DATABASE_URL!: string;

  @IsEnum(NodeEnvironment)
  NODE_ENV = NodeEnvironment.Development;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_EXPIRES_IN = '24h';

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  PUBLIC_BACKEND_URL = 'http://localhost:4000';

  @IsString()
  @MinLength(1)
  UPLOAD_DIR = './uploads';
}

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const environment = plainToInstance(Environment, {
    ...config,
    PORT: config.PORT === undefined ? 4000 : Number(config.PORT),
  });
  const errors = validateSync(environment);
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.map((error) => error.property).join(', ')}`);
  }
  return environment;
}
