import { Modal, ModalOverlay, ModalContent, ModalBody } from '@chakra-ui/react';
import { AccountLogIn, AccountRegister } from 'components/account';
// import {
//   SupplyAsset,
//   WithdrawAsset,
//   SupplyAssetNative,
//   WithdrawAssetNative,
// } from 'components/assets';

import { modalViews, useUI } from 'contexts/ui';

const ManagedModal: React.FC = () => {
  const { isModalOpen, closeModal, modalView } = useUI();

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          {modalView === modalViews.ACCOUNT_REGISTER && <AccountRegister />}
          {modalView === modalViews.ACCOUNT_LOGIN && <AccountLogIn />}
          {/* {modalView === modalViews.ACCOUNT_REGISTER && <AccountRegister />}
          {modalView === modalViews.ACCOUNT_LOGIN && <AccountLogIn />}
          {modalView === modalViews.SUPPLY_ASSET && <SupplyAsset />}
          {modalView === modalViews.SUPPLY_ASSET_NATIVE && <SupplyAssetNative />}
          {modalView === modalViews.WITHDRAW_ASSET && <WithdrawAsset />}
          {modalView === modalViews.WITHDRAW_ASSET_NATIVE && <WithdrawAssetNative />} */}
          {/* {modalView === 'VIEW_2' && <VIEW2 />} */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ManagedModal;
