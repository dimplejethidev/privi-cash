import { FC } from 'react';
import {
  Button,
  ButtonProps,
  Circle,
  HStack,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { ChevronDownIcon, CopyIcon, LogOutIcon } from 'components/icons';
import { formatDisplayAddress } from 'privi-utils';
import { useShieldedAccount } from 'contexts/shieldedAccount';

const ConnectedAddressButton: FC<ButtonProps> = ({ ...props }) => {
  const { address } = useAccount();
  const { logOut } = useShieldedAccount();

  const handleLogout = () => {
    logOut();
  };

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Button
          colorScheme="gray"
          leftIcon={<Circle bgColor="green" size={2} />}
          rightIcon={<ChevronDownIcon color="gray" />}
          fontWeight="regular"
          {...props}
        >
          {address?.slice(0, 5)}...{address?.slice(-4)}
        </Button>
      </PopoverTrigger>
      <PopoverContent minW="sm" shadow="lg" borderColor="white">
        <PopoverBody>
          <VStack alignItems="stretch" spacing={4} p={2}>
            <HStack alignItems="center">
              <Circle bgColor="green.400" size={2} />
              <Text>Connected</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="bold">{formatDisplayAddress(address || '')}</Text>
              <IconButton
                variant="ghost"
                colorScheme="gray"
                size="sm"
                icon={<CopyIcon />}
                aria-label="copy address"
              />
            </HStack>

            <Button
              rightIcon={<LogOutIcon />}
              variant="outline"
              colorScheme="red"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ConnectedAddressButton;
