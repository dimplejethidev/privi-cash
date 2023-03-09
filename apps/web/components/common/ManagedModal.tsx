import { Modal, ModalOverlay, ModalContent, ModalBody } from '@chakra-ui/react';
import { AccountLogIn, AccountRegister } from 'components/account';
import { NetworkSwitch } from 'components/wallet';
import { modalViews, useUI } from 'contexts/ui';

const ManagedModal: React.FC = () => {
  const { isModalOpen, closeModal, modalView, modalConfig } = useUI();

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} size="md" {...modalConfig}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          {modalView === modalViews.ACCOUNT_REGISTER && <AccountRegister />}
          {modalView === modalViews.ACCOUNT_LOGIN && <AccountLogIn />}
          {modalView === modalViews.NETWORK_SWITCH && <NetworkSwitch />}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ManagedModal;
