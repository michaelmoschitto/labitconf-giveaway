"use client";

import { useState } from "react";

import { ConnectWalletModal } from "@/components/connect-wallet/connect-wallet-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectWalletButtonProps {
  dict: {
    buttonText: string;
    modal: {
      title: string;
      walletLabel: string;
      walletPlaceholder: string;
      connect: string;
      cancel: string;
      walletNotFound: string;
      enterWallet: string;
      checkingWallet: string;
    };
  };
  className?: string;
}

const ConnectWalletButton = ({ dict, className }: ConnectWalletButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        size="sm"
        className={cn("text-sm", className)}
      >
        {dict.buttonText}
      </Button>

      <ConnectWalletModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dict={dict.modal}
      />
    </>
  );
};

export { ConnectWalletButton };
