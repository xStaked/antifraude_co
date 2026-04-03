import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof ReturnType<typeof resolveUser> | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

function resolveUser() {
  return {
    id: '',
    email: '',
    phone: '',
    fullName: '',
    documentNumber: '',
    phoneVerified: false,
    trustScore: 0,
    status: '' as const,
    role: '' as 'admin' | 'moderator',
    type: '' as 'admin' | 'user',
  };
}
