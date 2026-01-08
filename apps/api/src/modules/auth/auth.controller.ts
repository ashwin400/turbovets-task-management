import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser, CurrentUserData } from './decorators/current-user.decorator';
import { ILoginRequest, IRegisterRequest } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequest: ILoginRequest) {
    return this.authService.login(loginRequest);
  }

  @Public()
  @Post('register')
  async register(@Body() registerRequest: IRegisterRequest) {
    return this.authService.register(registerRequest);
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return user;
  }
}
