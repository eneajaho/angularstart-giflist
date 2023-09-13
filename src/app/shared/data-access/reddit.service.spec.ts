import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RedditService } from './reddit.service';

describe('RedditService', () => {
  let service: RedditService;
  let httpMock: HttpTestingController;

  const mockPost = {
    data: {
      url: 'test.mp4',
      author: 'josh',
      name: 'whatever',
      permalink: 'link',
      title: 'title',
      thumbnail: 'thumb',
      num_comments: 5,
    },
  };

  const mockPostWithInvalidSrc = {
    ...mockPost,
    data: { ...mockPost.data, url: '' },
  };

  const mockData = {
    data: {
      children: [mockPost, mockPost, mockPost, mockPostWithInvalidSrc],
    },
  };

  const parsedPost = {
    src: mockPost.data.url,
    author: mockPost.data.author,
    name: mockPost.data.name,
    permalink: mockPost.data.permalink,
    title: mockPost.data.title,
    thumbnail: mockPost.data.thumbnail,
    comments: mockPost.data.num_comments,
  };

  const expectedResults = [parsedPost, parsedPost, parsedPost] as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RedditService],
    });

    service = TestBed.inject(RedditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('source: subredditChanged$', () => {
    it('should load data from specified subreddit when form control changes', fakeAsync(() => {
      // initial load
      const requestOne = httpMock.expectOne(
        'https://www.reddit.com/r/gifs/hot/.json?limit=100'
      );
      requestOne.flush(mockData);

      const altMockData = {
        data: {
          children: [mockPost, mockPost],
        },
      };

      const expectedResults = [parsedPost, parsedPost] as any;

      const testValue = 'funny';
      service.subredditFormControl.setValue(testValue);

      // wait for debounce time
      tick(300);

      const requestTwo = httpMock.expectOne(
        `https://www.reddit.com/r/${testValue}/hot/.json?limit=100`
      );
      requestTwo.flush(altMockData);
      tick();

      expect(service.gifs()).toEqual(expectedResults);
    }));

    it('should continue to allow subreddit switching after an error', fakeAsync(() => {
      // initial load
      const requestOne = httpMock.expectOne(
        'https://www.reddit.com/r/gifs/hot/.json?limit=100'
      );
      requestOne.flush('', { status: 404, statusText: 'Not Found' });

      const altMockData = {
        data: {
          children: [mockPost, mockPost],
        },
      };

      const expectedResults = [parsedPost, parsedPost] as any;

      const testValue = 'funny';
      service.subredditFormControl.setValue(testValue);

      // wait for debounce time
      tick(300);

      const requestTwo = httpMock.expectOne(
        `https://www.reddit.com/r/${testValue}/hot/.json?limit=100`
      );
      requestTwo.flush(altMockData);
      tick();

      expect(service.gifs()).toEqual(expectedResults);
    }));
  });

  describe('source: gifsLoaded$', () => {
    it('should set gifs on initial load from gifs subreddit', () => {
      const request = httpMock.expectOne(
        'https://www.reddit.com/r/gifs/hot/.json?limit=100'
      );
      request.flush(mockData);

      expect(service.gifs()).toEqual(expectedResults);
    });
  });
});
