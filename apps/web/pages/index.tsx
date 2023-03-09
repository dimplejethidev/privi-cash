import type { NextPage } from 'next';
import Script from 'next/script';
import { Card, HStack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import logger from 'utils/logger';
import { DepositNative, WithdrawNative, Transfer } from 'components/pool';
import { RelayJobsList } from 'components/relayer';
import { useAccount, useNetwork } from 'wagmi';

const Home: NextPage = () => {
  const { chain } = useNetwork();
  const { isConnected } = useAccount();

  const isUnsupportedChain = isConnected && chain?.unsupported === true;

  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />

      {!isUnsupportedChain && (
        <HStack justify="space-around" alignItems="flex-start" px={2}>
          <Card w={600} flex={0.45} maxW="lg" bgColor="primary.50">
            <Tabs isFitted>
              <TabList>
                <Tab py={4}>Deposit</Tab>
                <Tab>Withdraw</Tab>
                <Tab>Transfer</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <DepositNative />
                </TabPanel>
                <TabPanel>
                  <WithdrawNative />
                </TabPanel>
                <TabPanel>
                  <Transfer />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
          {/* <RelayJobsList flex={0.45} /> */}
        </HStack>
      )}
    </Layout>
  );
};

export default Home;
