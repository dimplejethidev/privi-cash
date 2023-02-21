import { FC, useEffect, useState } from 'react';
import { Box, Button, Divider, StackProps, VStack } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormWithdrawAmountInput, FormTextInput, FormSelect } from 'components/form';
import logger from 'utils/logger';
import { usePoolWithdrawNative } from 'api/pool';
import { parseEther, parseUnits } from 'privi-utils';
import { isDev } from 'config/env';
import useToast from 'hooks/toast';
import { useInstance } from 'contexts/instance';
import TxSummary from './TxSummary';
import { useRelayWithdraw } from 'api/relayer';
import { useRelayers } from 'contexts/relayJobs';

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
  const { instance, chainId } = useInstance();
  const { withdrawAsync, testAsync } = usePoolWithdrawNative({
    poolAddress: instance?.pool,
  });
  const {
    data: relayData,
    error: relayError,
    relayWithdrawAsync,
  } = useRelayWithdraw({ poolAddress: instance?.pool });
  const { control, handleSubmit, setValue, getValues, watch } = useForm<IWithdrawInput>({
    resolver: yupResolver(schema),
    defaultValues: { amount: 0.01, recipient: address },
  });
  const { saveJob } = useRelayers();

  const [amount, txMethod] = watch(['amount', 'txMethod']);

  useEffect(() => {
    if (relayError) {
      logger.error('Error', relayError);
      showErrorToast({ description: 'Error relaying transaction' });
      return;
    }

    if (!relayData) return;
    const jobData = {
      id: relayData.id,
      type: 'withdraw',
      amount: parseUnits(`${amount}`, instance?.decimals).toString(),
    };
    saveJob(jobData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relayData]);

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

    let promise;
    if (txMethod === 'relayer') {
      logger.info('Sending via relayer...');
      promise = startRelayWithdraw(data);
    } else {
      logger.info('Sending via wallet...');
      promise = startWithdraw(data);
    }

    promise
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

  const startRelayWithdraw = async (data: IWithdrawInput) => {
    const amount = parseEther(`${data.amount}`);
    await relayWithdrawAsync(amount, data.recipient);
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
    // { label: 'Relayer', value: 'relayer' },
  ];

  return (
    <VStack alignItems="stretch" spacing={6} {...props}>
      <Box px={4}>
        <VStack as="form" alignItems="stretch" spacing={4} onSubmit={handleSubmit(submit)}>
          <FormWithdrawAmountInput
            name="amount"
            label="Token Amount"
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
