import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId: userId,
      },
    });
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmark.findFirst({
      where: {
        userId: userId,
        id: bookmarkId,
      },
    });
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    // get the bookmark by id
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    // check authorization
    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException('This bookmark is not yours... :(');

    // return the bookmark
    return this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    // get the bookmark by id
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    // check authorization
    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException('This bookmark is not yours... :(');

    // delete and return the bookmark
    return this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
