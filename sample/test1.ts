import { Prop, Scene } from '@quicker-js/class-transformer';
import { Test3 } from './test3';
import { Test2 } from './test2';

export class Test1<T> {
  @Prop({
    scenes: Scene.fromTypes(Test2, Test3),
  })
  data: T;
}
