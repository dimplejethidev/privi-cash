import { FC } from 'react';
import { path } from 'ramda';
import {
  FormControl,
  FormControlProps,
  InputProps,
  Input,
  FormLabel,
  FormErrorMessage,
  HStack,
  Avatar,
  Card,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { TokenPriceText } from 'components/common';
import { useGetTokenBalance } from 'api/token';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'privi-utils';
import { Instance } from 'config/network';

interface FormAmountInputProps extends FormControlProps {
  instance: Instance;
  name: string;
  label?: string;
  defaultValue?: string | number;
  helperText?: string;
  errorMessage?: string;
  placeholder?: string;
  type?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  control: Control<any>;
  _input?: InputProps;
}

const parseErrorKeys = (name: string): Array<string> => {
  return name.split('.');
};

const FormDepositAmountInput: FC<FormAmountInputProps> = ({
  instance,
  name,
  label,
  control,
  placeholder,
  type = 'text',
  defaultValue = '',
  helperText,
  isRequired,
  isInvalid,
  _input,
  ...props
}) => {
  const { field, formState } = useController({ name, control, defaultValue });
  const error = path(['errors', ...parseErrorKeys(name), 'message'], formState) as string;

  const { address } = useAccount();
  const { data } = useGetTokenBalance({ address, tokenAddress: instance.token.address as any });

  const setMaxAmount = () => {
    const max = formatUnits(data?.value || 0, instance.token.decimals);
    field.onChange(Number(max));
  };

  let amountWei;
  try {
    amountWei = parseUnits(field.value, instance.token.decimals);
  } catch (error) {
    amountWei = 0;
  }

  const balance = Number(data?.formatted).toFixed(4) || 0;

  return (
    <FormControl
      p={0}
      isRequired={isRequired}
      isInvalid={!!error}
      rounded="md"
      borderWidth={1}
      borderColor="gray.100"
      {...props}
    >
      <HStack justify="space-between" alignItems="center" pt={2} px={4}>
        <FormLabel fontWeight="semibold">{label}</FormLabel>
        <Text color="gray.500" fontSize="sm">
          {`Balance: ${balance} ${instance.token.symbol}`}
        </Text>
      </HStack>

      <VStack alignItems="stretch" px={4} py={2} bgColor="gray.50">
        <HStack justify="space-between" alignItems="center">
          <Input
            variant="unstyled"
            fontWeight="bold"
            fontSize="2xl"
            size="lg"
            type={type}
            onBlur={field.onBlur}
            placeholder={placeholder}
            onChange={(val: any) => field.onChange(val)}
            value={field.value}
            {..._input}
          />

          <Card
            display="flex"
            rounded="3xl"
            flexDirection="row"
            justify="center"
            alignItems="center"
            shadow="lg"
            px={2}
            py={2}
            w={32}
          >
            <Avatar src={instance.token.iconUrl} size="xs" />
            <Text ml={1} fontSize="sm">
              {instance.token.symbol}
            </Text>
          </Card>
        </HStack>

        <HStack justify="space-between" alignItems="center">
          <TokenPriceText
            color="gray.500"
            fontSize="sm"
            amount={amountWei}
            token={instance.token.name}
          />
          <Button variant="ghost" size="sm" onClick={setMaxAmount}>
            MAX
          </Button>
        </HStack>
      </VStack>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};

export default FormDepositAmountInput;
