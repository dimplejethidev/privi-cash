import { FC } from 'react';
import { Box, Button, Divider, Heading, StackProps, Text, VStack } from '@chakra-ui/react';
import { APP_NAME } from 'config/constants';
import { useSwitchNetwork } from 'wagmi';
import { defaultChainId } from 'config/network';

const NetworkSwitch: FC<StackProps> = ({ ...props }) => {
  const { switchNetwork } = useSwitchNetwork();

  const handleSwitch = () => {
    switchNetwork?.(defaultChainId);
  };
  return (
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        You are on wrong network
      </Heading>
      <Divider />
      <VStack alignItems="stretch" py={4} px={8}>
        <Text fontWeight="bold" pb={2}>
          Oops, your wallet is not on the right network.
        </Text>
        <Box pb={6}>
          <Text color="gray.400">
            It seems your wallet is running on a different network from {APP_NAME}.
          </Text>
          <Text color="gray.400">
            Please manually change the network in your wallet, or you can click the button below.
          </Text>
        </Box>
        <Button onClick={handleSwitch} colorScheme="orange">
          Switch Network
        </Button>
      </VStack>
    </VStack>
  );
};

export default NetworkSwitch;
