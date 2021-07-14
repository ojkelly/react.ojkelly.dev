import { useState, useCallback } from "react";

type ElementType<TCollection> =
  TCollection extends readonly (infer TArrayElement)[]
    ? TArrayElement
    : TCollection extends Set<infer TSetElement>
    ? TSetElement
    : TCollection extends Map<unknown, infer TMapElement>
    ? TMapElement
    : TCollection extends { readonly [key: string]: infer TObjectElement }
    ? TObjectElement
    : never;

type FormKeys<FormKey extends ElementType<string[]>> = {
  [key in FormKey]: string;
};

type InputValue = string | ReadonlyArray<string> | number | undefined;

type FormValue = {
  value: InputValue;
  dirty: boolean;
  hasError: boolean;
  errorMessage: string;
  isValid: boolean;
};

type FormValues<FormKey extends ElementType<string[]>> = {
  [key in FormKey]: FormValue;
};

type InitialFormValues<FormKey extends ElementType<string[]>> = {
  [key in FormKey]: InputValue;
};

type FormState<FormKey extends ElementType<string[]>> = {
  values: FormValues<FormKey>;
  // canSubmit when all fields are marked as isValid
  canSubmit: boolean;
  dirty: boolean;
  pending: boolean;
  hasSubmitError: boolean;
  submitErrorMessage: string;
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
  value: InputValue;
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
    value: InputValue,
    isSubmit: boolean,
    values: FormValues<FormKey>
  ) => ValidateResult;
  fields: readonly FormKey[];
  initialValues: InitialFormValues<FormKey>;
}): {
  handleSubmit: (event: { preventDefault: () => void }) => void;
  handleInputChange: React.ChangeEventHandler<HTMLInputElement>;
  setFormValue: (key: FormKey, value: InputValue) => void;
  formState: FormState<FormKey>;
  formKeys: FormKeys<FormKey>;
} => {
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
    value: InputValue,
    invalidIsError: boolean
  ): ValidateResult => {
    const validateResult = validate(key, value, invalidIsError, {
      ...formState.values,
    });

    setFormState((formState: FormState<FormKey>) => {
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

  // handleSubmit is called when the form is submitted
  // it handles running validation on all fields and then hands off to
  // submitCallback to look after managing the forms passed in onSubmit handler
  const handleSubmit = (event: { preventDefault: () => void }): void => {
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

  // submitCallback runs the onSubmit callback, and manages formState depending
  // on the result.
  const submitCallback = useCallback(
    async (formState: FormState<FormKey>) => {
      if (formState.pending) return;
      setFormState((formState: FormState<FormKey>) => ({
        ...formState,
        pending: true,
      }));
      try {
        onSubmit(formState.values);
        setFormState((formState: FormState<FormKey>) => ({
          ...formState,
          pending: false,
          hasSubmitError: false,
          submitErrorMessage: undefined,
        }));
      } catch (err) {
        setFormState((formState: FormState<FormKey>) => ({
          ...formState,
          pending: false,
          hasSubmitError: true,
          submitErrorMessage: err.message || "",
        }));
      }
    },
    [formState.pending]
  );

  // handleInputChange can be attached to onChange of any standard <input />
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (event.currentTarget instanceof HTMLInputElement) {
      event.persist();
      if (formState.pending) {
        return;
      }
      validateAndUpdateField(
        event.currentTarget.name as FormKey,
        event.currentTarget.value,
        false
      );
    }
  };

  // setFormValue is useful when you need to update a form value programatically.
  // This could be in your own component, or based on a third party library
  // like a CAPTCHA.
  const setFormValue = (key: FormKey, value: InputValue) => {
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
