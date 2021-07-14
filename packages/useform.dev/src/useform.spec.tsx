/* eslint-disable react/prop-types */

import React from "react";
import { render, screen, configure } from "@testing-library/react";

import {
  useForm,
  ValidateResult,
  FormValues,
  createFormKeys,
  ElementType,
} from "./useform";

configure({ testIdAttribute: "data-test-id" });

describe("useform.dev", () => {
  test("basic form", async () => {
    const mockSubmit = jest.fn();
    const testIds = {
      app: "app",
      submit: "submit",
      name: "name",
      email: "email",
      numbers: "numbers",
      words: "words",
    } as const;

    const TestForm = (): React.ReactElement => {
      const fields = [
        "name",
        "email",
        "numbers",
        "words",
        "radio",
        "checkbox",
      ] as const;

      type FormKeys = ElementType<typeof fields>;

      const formKeys = createFormKeys(fields);

      const validate = (field: FormKeys, value: any): ValidateResult => {
        const result = {
          error: "",
          hasError: false,
          isValid: false,
          canUpdate: true,
          value,
        };

        // switch (field) {
        //   case formKeys.username:
        //     // result.isValid = true;
        //     result.hasError = true;
        //     result.error = "this is an error";
        //     break;
        //   case formKeys.pin:
        //     if (value.length <= 4) {
        //       result.isValid = true;
        //     }
        //     break;
        // }
        return result;
      };
      const onSubmit = (values: FormValues<FormKeys>) => {
        mockSubmit({ values });
      };
      const { formState, handleInputChange, handleSubmit } = useForm<FormKeys>({
        onSubmit,
        validate,
        fields,
        initialValues: {
          name: "",
          email: "",
          numbers: "",
          words: "",
          radio: "small",
          checkbox: "",
        },
      });

      return (
        <div data-test-id={testIds.app}>
          <form onSubmit={handleSubmit}>
            <input
              data-test-id={testIds.name}
              name={formKeys.name}
              value={formState.values.name.value}
              onChange={handleInputChange}
            />
            {formState.values.name.hasError &&
              formState.values.name.errorMessage}

            <input
              data-test-id={testIds.email}
              name={formKeys.email}
              value={formState.values.email.value}
              onChange={handleInputChange}
            />
            {formState.values.email.hasError &&
              formState.values.email.errorMessage}

            <input
              data-test-id={testIds.numbers}
              name={formKeys.numbers}
              value={formState.values.numbers.value}
              onChange={handleInputChange}
            />
            {formState.values.numbers.hasError &&
              formState.values.numbers.errorMessage}

            <input
              data-test-id={testIds.words}
              name={formKeys.words}
              value={formState.values.words.value}
              onChange={handleInputChange}
            />
            {formState.values.words.hasError &&
              formState.values.words.errorMessage}

            <input
              type="radio"
              value="small"
              name={formKeys.radio}
              checked={formState.values.radio.value === "small"}
              onChange={handleInputChange}
            />

            <input
              type="radio"
              value="large"
              name={formKeys.radio}
              checked={formState.values.radio.value === "small"}
              onChange={handleInputChange}
            />

            <input
              type="checkbox"
              name={formKeys.checkbox}
              value="isChecked"
              onChange={handleInputChange}
            />

            <button
              data-test-id={testIds.submit}
              onClick={handleSubmit}
              disabled={formState.pending}
              type="submit"
            />
          </form>
        </div>
      );
    };

    render(<TestForm />);

    const app = await screen.findAllByTestId(testIds.app);

    expect(app).not.toBeNull();
    // expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step One");
    // act(() => {
    //   fireEvent.click(screen.getByTestId(testIds.next));
    // });
    // expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step Two");
    // act(() => {
    //   fireEvent.click(screen.getByTestId(testIds.next));
    // });
    // expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step Three");
    // act(() => {
    //   fireEvent.click(screen.getByTestId(testIds.next));
    // });
    // expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step Four");
    // act(() => {
    //   fireEvent.click(screen.getByTestId(testIds.next));
    // });
    // expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step One");

    expect(mockSubmit).toHaveBeenCalled();
  });
});
