import { FC } from 'react';
import { Box, Divider, HStack, StackProps, Text, Tooltip, VStack } from '@chakra-ui/react';
import { useFeeData } from 'wagmi';
import { BN, formatEther, parseEther } from 'privi-utils';
import { calculateRelayerFee } from 'utils/pool';
import { InfoIcon } from 'components/icons';

interface ITxFeeInfoProps extends StackProps {
  txMethod: string;
  amount: number;
  isAmountPublic?: boolean;
}

const TxSummary: FC<ITxFeeInfoProps> = ({ txMethod, amount, isAmountPublic = true, ...props }) => {
  const { data: feeData } = useFeeData();

  const isRelay = txMethod === 'relayer';
  const amountWei = parseEther(`${amount || 0}`);
  const { serviceFee, gasFee, totalFee } = calculateRelayerFee({
    amount: isAmountPublic ? amountWei : undefined,
    gasPrice: BN(feeData?.gasPrice || 0),
  });

  let total = amountWei;
  if (isRelay) {
    total = total.add(totalFee);
  }

  return (
    <VStack fontSize="sm" alignItems="stretch" {...props}>
      <HStack w="full" justify="space-between">
        <Text fontWeight="medium">Amount</Text>
        <Text fontWeight="medium">{formatEther(amountWei)}</Text>
      </HStack>
      <HStack w="full" justify="space-between">
        <HStack>
          <Text fontWeight="medium">Service Fee</Text>
          <Tooltip hasArrow label="Privi charges 0.0% service fee for every transaction">
            <Box>
              <InfoIcon color="gray" />
            </Box>
          </Tooltip>
        </HStack>
        <Text fontWeight="medium">{isRelay ? formatEther(serviceFee) : '-'}</Text>
      </HStack>
      <HStack w="full" justify="space-between">
        <Text fontWeight="medium">Gas Fee</Text>
        <Text fontWeight="medium">{isRelay ? formatEther(gasFee) : '-'}</Text>
      </HStack>
      <HStack w="full" justify="space-between">
        <Text fontWeight="medium">Total Fee</Text>
        <Text fontWeight="medium">{isRelay ? formatEther(totalFee) : '-'}</Text>
      </HStack>
      <Divider />
      <HStack w="full" justify="space-between" textColor="brand.500">
        <Text fontWeight="medium">Total</Text>
        <Text fontWeight="medium">{formatEther(total)}</Text>
      </HStack>
    </VStack>
  );
};

export default TxSummary;
