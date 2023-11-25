import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { getModelToken } from '@nestjs/mongoose';
import { Book, Category } from './schemas/book.schemas';
import mongoose, { Model } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book-dto';
import { User } from '../auth/schemas/user.schema';

describe('BookService', () => {
  let bookService: BookService;
  let model: Model<Book>;
  const mockBookService = {
    findById: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockBook = {
    _id: '65324bc71a5f592450e473ff',
    user: '6527e000bf1fe300e5ab24c2',
    title: 'Book 7',
    description: 'Book 7 Description',
    author: 'Author 7',
    price: 300,
    category: Category.CRIME,
    // createdAt: '2023-10-20T09:43:35.227Z',
    // updatedAt: '2023-10-20T09:43:35.227Z',
    // __v: 0,
  };

  const mockUser = {
    _id: '6527e000bf1fe300e5ab24c2',
    name: 'Test1',
    email: 'test1@mail.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getModelToken(Book.name),
          useValue: mockBookService,
        },
      ],
    }).compile();

    bookService = module.get<BookService>(BookService);
    model = module.get<Model<Book>>(getModelToken(Book.name));
  });

  describe('findAll', () => {
    it('should return an array of books', async () => {
      const query = { page: '1', keyword: 'test' };

      jest.spyOn(model, 'find').mockImplementation(
        () =>
          ({
            limit: () => ({
              skip: jest.fn().mockResolvedValue([mockBook]),
            }),
          }) as any,
      );

      const result = await bookService.findAll(query);

      expect(model.find).toHaveBeenCalledWith({
        title: { $regex: query.keyword, $options: 'i' },
      });

      expect(result).toEqual([mockBook]);
    });
  });

  describe('create', () => {
    it('should create and return a book', async () => {
      const newBook = {
        title: 'Book 7',
        description: 'Book 7 Description',
        author: 'Author 7',
        price: 300,
        category: Category.CRIME,
      };

      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockBook) as any);

      const result = await bookService.create(
        newBook as CreateBookDto,
        mockUser as User,
      );

      expect(result).toEqual(mockBook);
    });
  });

  describe('findById', () => {
    it('should find and return a book by ID', async () => {
      jest.spyOn(model, 'findById').mockResolvedValue(mockBook);

      const result = await bookService.findById(mockBook._id);

      expect(model.findById).toHaveBeenCalledWith(mockBook._id);
      expect(result).toEqual(mockBook);
    });

    it('should throw BadRequestException if invalid ID is provided', async () => {
      const id = 'invalid-id';

      const isValidObjectIDMock = jest
        .spyOn(mongoose, 'isValidObjectId')
        .mockReturnValue(false);

      await expect(bookService.findById(id)).rejects.toThrow(
        BadRequestException,
      );

      expect(isValidObjectIDMock).toHaveBeenCalledWith(id);
      isValidObjectIDMock.mockRestore();
    });

    it('should throw NotFoundException if book is not found', async () => {
      jest.spyOn(model, 'findById').mockResolvedValue(null);

      await expect(bookService.findById(mockBook._id)).rejects.toThrow(
        NotFoundException,
      );

      expect(model.findById).toHaveBeenCalledWith(mockBook._id);
    });
  });

  describe('updateById', () => {
    it('should update and return a book', async () => {
      const updatedBook = {
        ...mockBook,
        title: 'Update name',
      };
      const book = { title: 'Update name' };

      jest.spyOn(model, 'findByIdAndUpdate').mockResolvedValue(updatedBook);

      const result = await bookService.updateById(mockBook._id, book as any);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(mockBook._id, book, {
        new: true,
        runValidators: true,
      });

      expect(result.title).toEqual(book.title);
    });
  });

  describe('deleteById', () => {
    it('should delete and return a book', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(mockBook);

      const result = await bookService.deleteById(mockBook._id);

      expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockBook._id);

      expect(result).toEqual(mockBook);
    });
  });
});
