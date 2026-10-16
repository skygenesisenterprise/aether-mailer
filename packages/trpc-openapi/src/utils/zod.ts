import { ZodObject, ZodRawShape, ZodType, z } from 'zod';
import type { $ZodType, $ZodTypes } from 'zod/v4/core';
import type { $ZodTypeDef } from 'zod/v4/core/schemas';

export const instanceofZodType = (type: any): type is $ZodTypes => {
  return !!type?._zod?.def?.type;
};

export const instanceofZodTypeKind = <Z extends $ZodTypeDef['type']>(
  type: $ZodType,
  zodTypeKind: Z,
): type is $ZodTypes => {
  return type?._zod?.def?.type === zodTypeKind;
};

export const instanceofZodTypeOptional = (type: $ZodType): type is z.ZodOptional<$ZodTypes> => {
  return instanceofZodTypeKind(type, 'optional');
};

export const instanceofZodTypeObject = (type: $ZodType): type is z.ZodObject<z.ZodRawShape> => {
  return instanceofZodTypeKind(type, 'object');
};

export type ZodTypeLikeVoid = z.ZodVoid | z.ZodUndefined | z.ZodNever;

export const instanceofZodTypeLikeVoid = (type: $ZodType): type is ZodTypeLikeVoid => {
  return (
    instanceofZodTypeKind(type, 'void') ||
    instanceofZodTypeKind(type, 'undefined') ||
    instanceofZodTypeKind(type, 'never')
  );
};

export const unwrapZodType = (type: $ZodType, unwrapPreprocess: boolean): ZodType => {
  // TODO: Allow parsing array query params
  if (instanceofZodTypeKind(type, 'array')) {
    return unwrapZodType((type as z.ZodArray<$ZodTypes>).element, unwrapPreprocess);
  }
  if (instanceofZodTypeKind(type, 'enum')) {
    return unwrapZodType(z.string(), unwrapPreprocess);
  }
  if (instanceofZodTypeKind(type, 'nullable')) {
    return unwrapZodType((type as z.ZodNullable<$ZodTypes>).unwrap(), unwrapPreprocess);
  }

  if (instanceofZodTypeKind(type, 'optional')) {
    return unwrapZodType((type as z.ZodOptional<$ZodTypes>).unwrap(), unwrapPreprocess);
  }
  if (instanceofZodTypeKind(type, 'default')) {
    return unwrapZodType((type as z.ZodDefault<$ZodTypes>).unwrap(), unwrapPreprocess);
  }
  if (instanceofZodTypeKind(type, 'lazy')) {
    return unwrapZodType((type as z.ZodLazy<$ZodTypes>).def.getter(), unwrapPreprocess);
  }
  if (instanceofZodTypeKind(type, 'pipe') && unwrapPreprocess) {
    return unwrapZodType((type as z.ZodPipe<$ZodTypes>).def.out, unwrapPreprocess);
  }
  return type as ZodType;
};

export const instanceofZodTypeLikeString = (
  _type: $ZodType,
): boolean /* : _type is ZodTypeLikeString  */ => {
  const type = unwrapZodType(_type, false);

  if (instanceofZodTypeKind(type, 'pipe')) {
    return true;
  }

  // TODO improve this
  if (instanceofZodTypeKind(type, 'union')) {
    return !(type as any)._def.options.some((option: any) => !instanceofZodTypeLikeString(option));
  }

  if (instanceofZodTypeKind(type, 'intersection')) {
    return (
      instanceofZodTypeLikeString((type as z.ZodIntersection<$ZodTypes, $ZodTypes>).def.left) &&
      instanceofZodTypeLikeString((type as z.ZodIntersection<$ZodTypes, $ZodTypes>).def.right)
    );
  }

  if (instanceofZodTypeKind(type, 'literal')) {
    return typeof (type as z.ZodLiteral<any>).value === 'string';
  }

  if (instanceofZodTypeKind(type, 'enum')) {
    return !Object.values((type as z.ZodEnum<any>).enum).some((value) => typeof value === 'number');
  }

  return instanceofZodTypeKind(type, 'string');
};

export const zodSupportsCoerce = 'coerce' in z;

export type ZodTypeCoercible = z.ZodNumber | z.ZodBoolean | z.ZodBigInt | z.ZodDate;

export const instanceofZodTypeCoercible = (_type: $ZodType): _type is ZodTypeCoercible => {
  const type = unwrapZodType(_type, false);
  return (
    instanceofZodTypeKind(type, 'number') ||
    instanceofZodTypeKind(type, 'boolean') ||
    instanceofZodTypeKind(type, 'bigint') ||
    instanceofZodTypeKind(type, 'date')
  );
};

export const coerceSchema = (schema: ZodObject<ZodRawShape>) => {
  Object.values(schema.shape).forEach((shapeSchema) => {
    const unwrappedShapeSchema = unwrapZodType(shapeSchema, false);
    if (instanceofZodTypeCoercible(unwrappedShapeSchema)) unwrappedShapeSchema._def.coerce = true;
    else if (instanceofZodTypeObject(unwrappedShapeSchema)) coerceSchema(unwrappedShapeSchema);
  });
};

/**
 * Safely check if a schema is optional without triggering parse/preprocessing.
 * Important for zod-form-data schemas where isOptional()/safeParse() would trigger form parsing.
 */
export const isSchemaOptional = (schema: $ZodType): boolean => {
  if (instanceofZodTypeKind(schema, 'optional')) return true;
  if (instanceofZodTypeKind(schema, 'nullable')) return true;
  if (instanceofZodTypeKind(schema, 'default')) return true;
  if (instanceofZodTypeKind(schema, 'pipe')) {
    return isSchemaOptional((schema as z.ZodPipe<$ZodTypes>).def.out);
  }
  // Zod v3 compat: check ZodEffects inner schema
  const def = (schema as any)?._def;
  if (def?.typeName === 'ZodEffects') {
    return isSchemaOptional(def.schema);
  }
  return false;
};

/**
 * Detect if a schema is a zod-form-data file field (zfd.file()).
 * In Zod v4, zfd.file() creates: pipe(transform → custom) where custom validates instanceof File/Blob.
 */
export const instanceofZodFormDataFile = (_type: $ZodType): boolean => {
  const type = unwrapZodType(_type, false);

  // Zod v4: pipe(transform → custom) pattern from zfd.file()
  if (instanceofZodTypeKind(type, 'pipe')) {
    const out = (type as z.ZodPipe<$ZodTypes>).def.out;
    if (instanceofZodTypeKind(out, 'custom')) return true;
    if (instanceofZodTypeKind(out, 'any')) return true;
    return instanceofZodFormDataFile(out);
  }

  // Zod v3 compat: ZodEffects(preprocess) -> ZodEffects(refinement) -> ZodAny
  const def = (type as any)?._def;
  if (def?.typeName === 'ZodEffects' && def.effect?.type === 'preprocess') {
    const inner = def.schema;
    if (inner?._def?.typeName === 'ZodEffects' && inner._def.effect?.type === 'refinement') {
      if (inner._def.schema?._def?.typeName === 'ZodAny') return true;
    }
    if (inner?._def?.typeName === 'ZodAny') return true;
    if (inner?._def?.typeName === 'ZodUnion') {
      return inner._def.options.some((opt: any) => instanceofZodFormDataFile(opt));
    }
  }

  return false;
};

/** Check if an object schema contains any file fields */
export const schemaContainsFileField = (type: $ZodType): boolean => {
  const unwrapped = unwrapZodType(type, true);
  if (!instanceofZodTypeObject(unwrapped)) return false;

  return Object.values(unwrapped.shape).some((fieldSchema) => {
    const field = fieldSchema as $ZodType;
    return instanceofZodFormDataFile(field) || instanceofZodFormDataFile(unwrapZodType(field, false));
  });
};
