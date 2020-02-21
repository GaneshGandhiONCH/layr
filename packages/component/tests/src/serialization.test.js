import {Component, serialize, attribute} from '../../..';

describe('Serialization', () => {
  test('Component classes', async () => {
    class BaseMovie extends Component() {}

    expect(serialize(BaseMovie, {knownComponents: [BaseMovie]})).toEqual({
      __Component: 'BaseMovie'
    });

    class Movie extends BaseMovie {
      @attribute() static limit = 100;
      @attribute() static offset;
    }

    expect(serialize(Movie, {knownComponents: [Movie]})).toEqual({
      __Component: 'Movie',
      limit: 100,
      offset: {__undefined: true}
    });

    class Cinema extends Component() {
      @attribute() static MovieClass = Movie;
    }

    expect(() => serialize(Cinema, {knownComponents: [Cinema]})).toThrow(
      "The 'Movie' component is unknown"
    );

    expect(serialize(Cinema, {knownComponents: [Cinema, Movie]})).toEqual({
      __Component: 'Cinema',
      MovieClass: {__Component: 'Movie', limit: 100, offset: {__undefined: true}}
    });
  });

  test('Component instances', async () => {
    class Movie extends Component() {
      @attribute() title = '';
      @attribute() director;
    }

    let movie = new Movie();

    expect(serialize(movie, {knownComponents: [Movie]})).toEqual({
      __component: 'Movie',
      __new: true,
      title: '',
      director: {__undefined: true}
    });

    movie = Movie.instantiate();

    expect(serialize(movie, {knownComponents: [Movie]})).toEqual({
      __component: 'Movie'
    });

    movie.title = 'Inception';

    expect(serialize(movie, {knownComponents: [Movie]})).toEqual({
      __component: 'Movie',
      title: 'Inception'
    });

    class Director extends Component() {
      @attribute() name;
    }

    movie.director = new Director();
    movie.director.name = 'Christopher Nolan';

    expect(serialize(movie, {knownComponents: [Movie, Director]})).toEqual({
      __component: 'Movie',
      title: 'Inception',
      director: {__component: 'Director', __new: true, name: 'Christopher Nolan'}
    });

    expect(
      serialize(movie, {
        knownComponents: [Movie],
        attributeFilter(attribute) {
          expect(this).toBe(movie);
          expect(attribute.getParent()).toBe(movie);
          return attribute.getName() === 'title';
        }
      })
    ).toEqual({
      __component: 'Movie',
      title: 'Inception'
    });

    expect(
      await serialize(movie, {
        knownComponents: [Movie],
        async attributeFilter(attribute) {
          expect(this).toBe(movie);
          expect(attribute.getParent()).toBe(movie);
          return attribute.getName() === 'title';
        }
      })
    ).toEqual({
      __component: 'Movie',
      title: 'Inception'
    });
  });

  test('Functions', async () => {
    function sum(a, b) {
      return a + b;
    }

    expect(serialize(sum)).toEqual({});
    expect(serialize(sum, {serializeFunctions: true})).toEqual({
      __function: 'function sum(a, b) {\n      return a + b;\n    }'
    });

    sum.displayName = 'sum';

    expect(serialize(sum)).toEqual({displayName: 'sum'});
    expect(serialize(sum, {serializeFunctions: true})).toEqual({
      __function: 'function sum(a, b) {\n      return a + b;\n    }',
      displayName: 'sum'
    });

    sum.__context = {x: 1, y: 2};

    expect(serialize(sum)).toEqual({displayName: 'sum', __context: {x: 1, y: 2}});
    expect(serialize(sum, {serializeFunctions: true})).toEqual({
      __function: 'function sum(a, b) {\n      return a + b;\n    }',
      displayName: 'sum',
      __context: {x: 1, y: 2}
    });
  });
});