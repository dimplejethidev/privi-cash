import { useRouter } from 'next/router';
import { Flex, FlexProps, HStack, Text } from '@chakra-ui/react';
import { APP_NAME, ROUTES } from 'config/constants';
import Logo from '../Logo';
import {
  ConnectedChainButton,
  ConnectedAddressButton,
  ConnectWalletButton,
} from 'components/wallet';
import { useAccount } from 'wagmi';

const Header: React.FC<FlexProps> = ({ ...props }) => {
  const { isConnected } = useAccount();

  const router = useRouter();

  return (
    <Flex px={16} py={4} justify="space-between" {...props}>
      <HStack spacing={4}>
        <HStack onClick={() => router.push(ROUTES.HOME)} cursor="pointer">
          <Logo />
          <Text color="primary.500" fontSize="2xl" fontWeight="bold" pl={2}>
            {APP_NAME}
          </Text>
          <Text fontSize="sm" rounded="md" bgColor="gray.100" color="gray.500" px={1}>
            BETA
          </Text>
        </HStack>
      </HStack>

      <HStack spacing={4}>
        {!isConnected && <ConnectWalletButton />}
        {isConnected && <ConnectedChainButton />}
        {isConnected && <ConnectedAddressButton />}
      </HStack>
    </Flex>
  );
};

export default Header;
