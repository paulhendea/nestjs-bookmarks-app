import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // compile app files
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // simulate applications
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    // clean database
    prisma = app.get(PrismaService);
    prisma.cleanDb();

    // set base URL
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@email.com',
      password: 'password',
    };

    describe('SignUp', () => {
      it('should fail if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should fail if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should fail if email and password are emtpy', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED);
      });
    });

    describe('SignIn', () => {
      it('should fail if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should fail if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should fail if email and password are emtpy', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .stores('authorization', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('sould get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'Magnus',
        lastName: 'Carlsen',
        email: 'magnus-carlsen@email.com',
      };
      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName)
          .expectBodyContains(dto.email);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Get bookmarks empty', () => {
      it('should get no bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First bookmark',
        link: 'https://www.youtube.com/watch?v=GHTA143_b-s&ab_channel=freeCodeCamp.org',
      };
      it('should create a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.link)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        description: 'NestJs Course for Beginners - Create a REST API',
      };
      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}')
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
    describe('Get bookmarks empty again', () => {
      it('should get no bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{authorization}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });
  });
});
