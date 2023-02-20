import { FC, useEffect, useState } from 'react';
import { Box, Button, Divider, Heading, StackProps, VStack } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormDepositAmountInput, FormTextInput } from 'components/form';
import logger from 'utils/logger';
import { usePoolDepositNative } from 'api/pool';
import { parseEther } from 'privi-utils';
import { isDev } from 'config/env';
import useToast from 'hooks/toast';
import { useInstance } from 'contexts/instance';

const schema = yup.object().shape({
  amount: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
  recipient: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

interface IDepositInput {
  amount: number;
  recipient: string;
}

const DepositNative: FC<StackProps> = ({ ...props }) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const { showErrorToast } = useToast();
  const { address } = useAccount();
  const { instance } = useInstance();
  const { depositAsync, testAsync } = usePoolDepositNative({
    poolAddress: instance?.pool,
  });
  const { control, handleSubmit, setValue, getValues } = useForm<IDepositInput>({
    resolver: yupResolver(schema),
    defaultValues: { amount: 0.01, recipient: address },
  });

  useEffect(() => {
    const v = getValues('recipient');
    if (!v && address) {
      setValue('recipient', address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const submit = (data: IDepositInput) => {
    logger.info('DepositNative', data);
    setLoading(true);
    startDeposit(data)
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

  const startDeposit = async (data: IDepositInput) => {
    const amount = parseEther(`${data.amount}`);
    await depositAsync(amount, data.recipient);
  };

  const simulateTest = async () => {
    setLoading(true);
    const data = getValues();
    const amount = parseEther(`${data.amount}`);
    await testAsync(amount, data.recipient)
      .catch((err) => {
        logger.error(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <VStack alignItems="stretch" spacing={6} {...props}>
      <Box px={4}>
        <VStack as="form" alignItems="stretch" spacing={4} onSubmit={handleSubmit(submit)}>
          <FormDepositAmountInput
            name="amount"
            label="Token Amount"
            control={control}
            instance={instance}
          />
          <FormTextInput
            label="Recipient's Address"
            name="recipient"
            control={control}
            helperText="You can either enter your address to shield your asset or other receiver’s shielded address to directly transfer asset in single click"
          />
          <Button type="submit" isLoading={isLoading}>
            Deposit
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

export default DepositNative;
