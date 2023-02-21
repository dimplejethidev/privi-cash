import { FC } from 'react';
import { Box, Divider, Heading, StackProps, VStack } from '@chakra-ui/react';
import RelayJobItem from './RelayJobItem';
import { useRelayers } from 'contexts/relayJobs';
import { useInstance } from 'contexts/instance';

interface IRelayJobsListProps extends StackProps {}

const RelayJobsList: FC<IRelayJobsListProps> = ({ ...props }) => {
  const { removeJob, jobs } = useRelayers();
  const { chainId } = useInstance();

  const currentChainJobs = jobs?.filter((job: any) => job.chainId === chainId) || [];

  return (
    <Box p={4} {...props}>
      <Heading fontSize="2xl" color="brand.500" textAlign="center" py={2}>
        Relay Jobs
      </Heading>
      <VStack alignItems="stretch" maxH="80vh" rounded="md" w="full">
        {currentChainJobs?.length === 0 && (
          <Box textAlign="center" py={16}>
            No Jobs Yet!
          </Box>
        )}

        {currentChainJobs?.map((job: any) => (
          <Box key={job.id} px={2}>
            <RelayJobItem job={job} onRemove={removeJob} />
            <Divider />
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default RelayJobsList;
