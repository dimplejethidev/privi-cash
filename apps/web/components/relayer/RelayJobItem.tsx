import { FC, useEffect } from 'react';
import { HStack, IconButton, Link, StackProps, Text, VStack } from '@chakra-ui/react';
import { useGetRelayJobStatus } from 'api/relayer';
import { CrossIcon } from 'components/icons';
import { formatDate } from 'utils/time';
import { RelayJob, useRelayers } from 'contexts/relayJobs';
import { getBlockExplorerUrl } from 'utils/network';
import { formatUnitsRounded } from 'privi-utils';
import { useInstance } from 'contexts/instance';

interface IRelayJobItemProps extends StackProps {
  job: RelayJob;
  onRemove: (id: string) => void;
}

const RelayJobItem: FC<IRelayJobItemProps> = ({ job, onRemove, ...props }) => {
  const { data, isLoading, isError } = useGetRelayJobStatus(job);
  const { updateJob } = useRelayers();
  const { instances } = useInstance();

  useEffect(() => {
    if (!data?.status) return;
    updateJob(job.id, { status: data?.status, txHash: data?.txHash });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status, job.id]);

  const instance = instances[job.token];

  return (
    <VStack alignItems="stretch" p={2} fontSize="sm" spacing={1} {...props}>
      {isLoading && 'Loading..'}
      {isError && 'Error'}

      <HStack justify="space-between" alignItems="flex-start">
        <Text fontWeight="bold">{job?.status?.toUpperCase()}</Text>
        <HStack>
          <Text fontSize="xs" color="gray.500">
            {formatDate(job.timestamp)}
          </Text>
          <IconButton
            icon={<CrossIcon />}
            variant="ghost"
            size="sm"
            aria-label="close"
            onClick={() => onRemove(job.id)}
          />
        </HStack>
      </HStack>
      <HStack justify="space-between">
        <VStack spacing={0} alignItems="flex-start">
          <Text fontWeight="bold">Tx Hash:</Text>
          {job?.txHash ? (
            <Link href={getBlockExplorerUrl(job.txHash, job.chainId)} color="gray.500" isExternal>
              {job?.txHash?.slice(0, 10)}...{job?.txHash?.slice(50)}
            </Link>
          ) : (
            <Text fontWeight="bold" px={2}>
              -
            </Text>
          )}
        </VStack>
        <VStack justify="space-between" alignItems="flex-end">
          <Text fontWeight="bold">Amount:</Text>
          <Text>
            {formatUnitsRounded(job.amount, instance.token.decimals)} {instance.token.symbol}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  );
};

export default RelayJobItem;
