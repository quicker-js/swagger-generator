import 'reflect-metadata';
import { describe } from 'mocha';
import classTransformer from '@quicker-js/class-transformer';
import { Test1 } from '../sample/test1';

describe('path-handler.spec.ts', () => {
  it('should ', function () {
    const plainToInstance = classTransformer.plainToInstance(
      Test1,
      {
        data: [{}],
      },
      {
        scene: 'Test3',
      }
    );
    console.log(plainToInstance);
  });

  // it('should parseHandler generator', () => {
  //   const parseHandler = ParseHandler.create();
  //   void parseHandler.generator();
  // });
  // it('should ResponseResult<PageList<ModbusVoltageHistory>>', () => {
  //   const genericParameters = ParserUtil.getGenericParameters(
  //     'ResponseResult<PageList<ModbusVoltageHistory>>'
  //   );
  //   console.log(genericParameters);
  // });
  // it('should SwaggerFile getGeneric ResponseResult«PageList«ModbusVoltageHistory»».', function () {
  //   const generic = SwaggerFile.getGeneric(
  //     'ResponseResult«PageList«ModbusVoltageHistory»»'
  //   );
  //   expect(generic).eq('PageList<ModbusVoltageHistory>');
  // });
  //
  // it('should SwaggerFile getGeneric PageList«ModbusVoltageHistory».', function () {
  //   const generic = SwaggerFile.getGeneric('PageList«ModbusVoltageHistory»');
  //   expect(generic).eq('ModbusVoltageHistory');
  // });
  //
  // it('should SwaggerFile getGeneric ModbusVoltageHistory.', function () {
  //   const generic = SwaggerFile.getGeneric('ModbusVoltageHistory');
  //   expect(generic).eq('');
  // });
  // it('should parseHandler generator', () => {
  //   // ResponseResult«PageList«ModbusVoltageHistory»»
  //   // /excelRecord/delImportStore/{id}
  //   const s1 = ParseHandler.nameParser(
  //     'ResponseResult«PageList«ModbusVoltageHistory»»',
  //     'kebabCase'
  //   );
  //
  //   const s2 = ParseHandler.nameParser(
  //     '/excelRecord/delImportStore/{id}',
  //     'kebabCase'
  //   );
  //
  //   const s3 = ParseHandler.nameParser(
  //     'ResponseResult«PageList«ModbusVoltageHistory»»',
  //     'camelCase'
  //   );
  //
  //   const s4 = ParseHandler.nameParser(
  //     '/excelRecord/delImportStore/{id}',
  //     'camelCase'
  //   );
  //
  //   console.log(s1);
  //   console.log(s2);
  //   console.log(s3);
  //   console.log(s4);
  // });
});
