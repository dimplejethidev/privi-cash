import { FC, useEffect } from 'react';
import { HStack, IconButton, Link, StackProps, Text, VStack } from '@chakra-ui/react';
import { useGetRelayJobStatus } from 'api/relayer';
import { CrossIcon } from 'components/icons';
import { formatDate } from 'utils/time';
import { RelayJob, useRelayers } from 'contexts/relayJobs';
import { getBlockExplorerUrl } from 'utils/network';

interface IRelayJobItemProps extends StackProps {
  job: RelayJob;
  onRemove: (id: string) => void;
}

const RelayJobItem: FC<IRelayJobItemProps> = ({ job, onRemove, ...props }) => {
  const { data, isLoading, isError } = useGetRelayJobStatus(job);
  const { updateJob } = useRelayers();

  useEffect(() => {
    if (!data?.status) return;
    updateJob(job.id, { status: data?.status, txHash: data?.txHash });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status, job.id]);

  return (
    <VStack alignItems="stretch" py={2} fontSize="sm" spacing={1} {...props}>
      {isLoading && 'Loading..'}
      {isError && 'Error'}

      <HStack justify="space-between" alignItems="flex-start">
        <Text fontSize="xs">{formatDate(job.timestamp)}</Text>
        <Text fontWeight="bold">{job?.status?.toUpperCase()}</Text>
        <IconButton
          icon={<CrossIcon />}
          variant="ghost"
          size="sm"
          aria-label="close"
          onClick={() => onRemove(job.id)}
        />
      </HStack>
      <HStack justify="space-between">
        <Text fontWeight="bold">Tx Hash:</Text>
        {job?.txHash ? (
          <Link href={getBlockExplorerUrl(job.txHash, job.chainId)} color="brand.500" isExternal>
            {job?.txHash?.slice(0, 10)}...{job?.txHash?.slice(50)}
          </Link>
        ) : (
          <Text fontWeight="bold" px={2}>
            -
          </Text>
        )}
      </HStack>
      <HStack justify="space-between">
        <Text fontWeight="bold">Amount:</Text>
        <Text fontWeight="bold">{job.amount}</Text>
      </HStack>
    </VStack>
  );
};

export default RelayJobItem;
