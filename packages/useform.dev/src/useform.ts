import { useState, useCallback } from "react";

type ElementType<TCollection> =
  TCollection extends readonly (infer TArrayElement)[]
    ? TArrayElement
    : TCollection extends Set<infer TSetElement>
    ? TSetElement
    : TCollection extends Map<any, infer TMapElement>
    ? TMapElement
    : TCollection extends { readonly [key: string]: infer TObjectElement }
    ? TObjectElement
    : never;

type FormKeys<FormKey extends ElementType<string[]>> = {
  [key in FormKey]: string;
};

type FormValue = {
  value: any;
  dirty: boolean;
  hasError: boolean;
  errorMessage: string;
  isValid: boolean;
};

type FormValues<FormKey extends ElementType<string[]>> = {
  [key in FormKey]: FormValue;
};

type InitialFormValues<FormKey extends ElementType<string[]>> = {
  [key in FormKey]: any;
};

type FormState<FormKey extends ElementType<string[]>> = {
  values: FormValues<FormKey>;
  // canSubmit when all fields are marked as isValid
  canSubmit: boolean;
  dirty: boolean;
  pending: boolean;
  hasSubmitError: boolean;
  submitErrorMessage: any;
};

type ValidateResult = {
  // error message to show to the user
  error: string;
  // hasError is true when the error message above should be displayed
  hasError: boolean;
  // isValid is true when the new value can be submitted
  isValid: boolean;
  // canUpdate is true when the new value can be saved
  canUpdate: boolean;
  // value allows the validate function to modify the value
  value: any;
};

function createFormKeys<N extends string>(
  keys: readonly N[]
): { [key in N]: string } {
  return keys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: `${key}`,
    }),
    {} as { [key in N]: string }
  );
}
const useForm = <FormKey extends ElementType<string[]>>({
  onSubmit,
  validate,
  fields,
  initialValues,
}: {
  onSubmit: (formState: FormValues<FormKey>) => void;
  validate: (
    field: keyof FormValues<FormKey>,
    value: any,
    isSubmit: boolean,
    values: FormValues<FormKey>
  ) => ValidateResult;
  fields: readonly FormKey[];
  initialValues: InitialFormValues<FormKey>;
}) => {
  const [formKeys] = useState<FormKeys<FormKey>>(
    fields.reduce(
      (acc, key) => ({
        ...acc,
        [key]: `${key}`,
      }),
      {} as { [key in FormKey]: string }
    )
  );

  const [formState, setFormState] = useState<FormState<FormKey>>({
    // Setup form values initial state
    values: fields.reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          value: initialValues[key],
          dirty: false,
          isValid: false,
          hasError: false,
          errorMessage: "",
        },
      }),
      {} as { [key in FormKey]: FormValue }
    ),
    canSubmit: false,
    dirty: false,
    pending: false,
    hasSubmitError: false,
    submitErrorMessage: undefined,
  });

  const validateAndUpdateField = (
    key: keyof FormValues<FormKey>,
    value: any,
    invalidIsError: boolean
  ): ValidateResult => {
    const validateResult = validate(key, value, invalidIsError, {
      ...formState.values,
    });

    setFormState((formState: { values: { [x: string]: { isValid: any } } }) => {
      const canSubmit = Object.keys(formState.values).every((k: string) => {
        if (key === k) {
          return validateResult.canUpdate
            ? validateResult.isValid
            : formState.values[key].isValid;
        } else {
          const v: FormValue = formState.values[k];

          return v.isValid;
        }
      });

      return {
        ...formState,
        values: {
          ...formState.values,
          [key]: {
            value: validateResult.canUpdate
              ? validateResult.value
              : formState.values[key].value,
            dirty: true,
            isValid: validateResult.canUpdate
              ? validateResult.isValid
              : formState.values[key].isValid,
            hasError:
              validateResult.hasError ||
              (invalidIsError && !validateResult.isValid),
            errorMessage: validateResult.error,
          },
        },
        dirty: true,
        canSubmit,
      };
    });

    return validateResult;
  };

  const handleSubmit = (event: { preventDefault: () => void }) => {
    if (event) {
      event.preventDefault();
    }
    if (formState.pending) {
      return;
    }
    // Validate all fields
    let hasError = false;

    Object.keys(formKeys).forEach((key) => {
      const value = formState.values[key].value;
      const result = validateAndUpdateField(key as FormKey, value, true);

      if (result.hasError || !result.isValid) {
        hasError = true;
      }
    });
    const canSubmit = Object.keys(formState.values).every((k: string) => {
      const v: FormValue = formState.values[k];

      return v.isValid;
    });

    if (!canSubmit) {
      return;
    }
    if (!hasError) {
      submitCallback(formState);
    }
  };

  const submitCallback = useCallback(
    async (formState: { pending: any; values: FormValues<FormKey> }) => {
      if (formState.pending) return;
      setFormState((formState: any) => ({
        ...formState,
        pending: true,
      }));
      try {
        onSubmit(formState.values);
        setFormState((formState: any) => ({
          ...formState,
          pending: false,
          hasSubmitError: false,
          submitErrorMessage: undefined,
        }));
      } catch (err) {
        setFormState((formState: any) => ({
          ...formState,
          pending: false,
          hasSubmitError: true,
          submitErrorMessage: err.message || "",
        }));
      }
    },
    [formState.pending]
  );

  const handleInputChange = (event: {
    persist: () => void;
    target: { name: FormKey; value: any };
  }) => {
    event.persist();
    if (formState.pending) {
      return;
    }
    validateAndUpdateField(event.target.name, event.target.value, false);
  };
  const setFormValue = (key: FormKey, value: any) => {
    if (formState.pending) {
      return;
    }

    validateAndUpdateField(key, value, false);
  };

  return {
    handleSubmit,
    handleInputChange,
    setFormValue,
    formState,
    formKeys,
  };
};

export {
  useForm,
  ValidateResult,
  FormValue,
  FormValues,
  FormKeys,
  createFormKeys,
  ElementType,
};
