import { FC, useEffect, useState } from 'react';
import { Box, Button, Divider, StackProps, VStack } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormWithdrawAmountInput, FormTextInput, FormSelect } from 'components/form';
import logger from 'utils/logger';
import { usePoolWithdrawNative } from 'api/pool';
import { parseEther } from 'privi-utils';
import { isDev } from 'config/env';
import useToast from 'hooks/toast';
import { useInstance } from 'contexts/instance';
import TxSummary from './TxSummary';

const schema = yup.object().shape({
  amount: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
  recipient: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

interface IWithdrawInput {
  amount: number;
  recipient: string;
  txMethod: string;
}

const WithdrawNative: FC<StackProps> = ({ ...props }) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const { showErrorToast } = useToast();
  const { address } = useAccount();
  const { instance } = useInstance();
  const { withdrawAsync, testAsync } = usePoolWithdrawNative({
    poolAddress: instance?.pool,
  });
  const { control, handleSubmit, setValue, getValues, watch } = useForm<IWithdrawInput>({
    resolver: yupResolver(schema),
    defaultValues: { amount: 0.01, recipient: address },
  });

  const [amount, txMethod] = watch(['amount', 'txMethod']);

  useEffect(() => {
    const v = getValues('recipient');
    if (!v && address) {
      setValue('recipient', address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const submit = (data: IWithdrawInput) => {
    logger.info('WithdrawNative', data);
    setLoading(true);
    startWithdraw(data)
      .then(() => {
        logger.info('Tx Sent');
      })
      .catch((err) => {
        logger.error(err);
        showErrorToast({ description: err.message });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const startWithdraw = async (data: IWithdrawInput) => {
    const amount = parseEther(`${data.amount}`);
    await withdrawAsync(amount, data.recipient);
  };

  const simulateTest = async () => {
    setLoading(true);
    const data = getValues();
    const amount = parseEther(`${data.amount}`);
    await testAsync(amount, data.recipient)
      .catch((err) => {
        logger.error(err);
        showErrorToast({ description: err.message });
      })
      .finally(() => setLoading(false));
  };

  const txMethodOptions = [
    { label: 'Wallet', value: 'wallet' },
    { label: 'Relayer', value: 'relayer' },
  ];

  return (
    <VStack alignItems="stretch" spacing={6} {...props}>
      <Box px={4}>
        <VStack as="form" alignItems="stretch" spacing={4} onSubmit={handleSubmit(submit)}>
          <FormWithdrawAmountInput
            name="amount"
            label="Enter Amount"
            control={control}
            instance={instance}
          />

          <FormTextInput label="Recipient Address" name="recipient" control={control} />

          <VStack alignItems="stretch" spacing={4} bgColor="white" rounded="md" p={4}>
            <FormSelect
              label="Transaction Method"
              name="txMethod"
              control={control}
              options={txMethodOptions}
            />
            <Divider />
            <TxSummary txMethod={txMethod} amount={amount} />
          </VStack>

          <Button type="submit" isLoading={isLoading}>
            Withdraw
          </Button>

          {isDev && (
            <Button onClick={simulateTest} isLoading={isLoading} colorScheme="orange">
              Test
            </Button>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default WithdrawNative;
