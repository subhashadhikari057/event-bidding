import { plainToInstance } from 'class-transformer';
import { IsInt, IsUrl, Max, Min, validateSync } from 'class-validator';

class Environment {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  FRONTEND_URL = 'http://localhost:3000';

  @IsUrl({ protocols: ['postgresql', 'postgres'], require_protocol: true, require_tld: false })
  DATABASE_URL!: string;
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
