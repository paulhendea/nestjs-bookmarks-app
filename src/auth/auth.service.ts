import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt/dist';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: AuthDto) {
    try {
      // generate the password hash
      const hashPassword = await argon.hash(dto.password);
      // save the new user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hashPassword,
        },
      });

      // return the saved user
      return this.signToken(user.id, user.email);
    } catch (error) {
      // TODO: not working -> error instanceof PrismaClientKnownRequestError === false
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(`${dto.email} is taken :(`);
        }
      } else {
        throw error;
      }
    }
  }

  async signIn(dto: AuthDto) {
    // find the user by email
    // if the user does not exist throw exception
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('Incorrect credentials');

    // compare passwords
    // if the password is incorrect throw exception
    const passwordMatches = await argon.verify(user.hashPassword, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Incorrect credentials');

    // send back the jwt
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return { access_token: token };
  }
}
