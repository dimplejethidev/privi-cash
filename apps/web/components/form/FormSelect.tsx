import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';
import { path } from 'ramda';
import {
  FormControl,
  FormControlProps,
  FormErrorMessage,
  FormLabel,
  Select,
  SelectProps,
} from '@chakra-ui/react';

interface ISelectOption {
  label: string;
  value: string;
}

interface FormSelectProps extends FormControlProps {
  name: string;
  label?: string;
  errorMessage?: string;
  placeholder?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  control?: Control<any>;
  options: ISelectOption[];
  _select?: SelectProps;
}

const FormSelect: FC<FormSelectProps> = ({
  name,
  label,
  control,
  placeholder,
  errorMessage,
  isRequired,
  isInvalid,
  options,
  _select,
  ...props
}) => {
  const error: string =
    errorMessage || (path(['_formState', 'errors', name, 'message'], control) as string);

  return (
    <FormControl
      display="flex"
      w="full"
      flexDir="row"
      justifyContent="space-between"
      alignItems="center"
      isRequired={isRequired}
      isInvalid={isInvalid ?? !!error}
      {...props}
    >
      <FormLabel>{label}</FormLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            w={200}
            variant="filled"
            onChange={(val) => field.onChange(val)}
            value={field.value}
            placeholder={placeholder}
            {..._select}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )}
      />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};

export default FormSelect;
