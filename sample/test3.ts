import { Entity } from '@quicker-js/class-transformer';

@Entity({
  scenes: [
    {
      value: 'Test3',
      type: Array,
    },
  ] as any,
})
export class Test3 {}
