import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  SimpleGrid,
  Box,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import type { LogoType } from '../../hooks/useLogoPreference';
import { DistroIcon } from '../panels/DistroIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: LogoType;
  onSave: (logo: LogoType) => void;
}

const LOGO_OPTIONS: Array<{ value: LogoType; label: string }> = [
  { value: 'melm', label: 'MELM' },
  { value: 'alpine', label: 'Alpine Linux' },
  { value: 'arch', label: 'Arch Linux' },
  { value: 'centos', label: 'CentOS' },
  { value: 'debian', label: 'Debian' },
  { value: 'fedora', label: 'Fedora' },
  { value: 'linux', label: 'Generic Linux' },
  { value: 'nixos', label: 'NixOS' },
  { value: 'opensuse', label: 'openSUSE' },
  { value: 'ubuntu', label: 'Ubuntu' },
];

export function SettingsModal({ isOpen, onClose, currentLogo, onSave }: SettingsModalProps) {
  const [selectedLogo, setSelectedLogo] = useState<LogoType>(currentLogo);

  const handleSave = () => {
    onSave(selectedLogo);
    onClose();
  };

  const handleCancel = () => {
    setSelectedLogo(currentLogo);
    onClose();
  };

  const selectedBg = useColorModeValue('blue.100', 'blue.700');
  const selectedBorder = useColorModeValue('blue.500', 'blue.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="bg.panel" borderColor="border.primary" borderWidth="1px">
        <ModalHeader color="fg.primary">Settings</ModalHeader>
        <ModalCloseButton color="fg.primary" />

        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color="fg.secondary" fontSize="sm">
              Select a logo to display in the top-left corner of the dashboard
            </Text>

            <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4}>
              {LOGO_OPTIONS.map(({ value, label }) => {
                const isSelected = selectedLogo === value;

                return (
                  <Box
                    key={value}
                    as="button"
                    onClick={() => setSelectedLogo(value)}
                    p={4}
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor={isSelected ? selectedBorder : borderColor}
                    bg={isSelected ? selectedBg : 'transparent'}
                    _hover={{
                      bg: isSelected ? selectedBg : hoverBg,
                      transform: 'scale(1.05)',
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    position="relative"
                  >
                    <VStack spacing={2}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="48px"
                      >
                        <DistroIcon distro={value} size={40} />
                      </Box>
                      <Text
                        fontSize="xs"
                        color={isSelected ? 'fg.primary' : 'fg.secondary'}
                        fontWeight={isSelected ? 'semibold' : 'normal'}
                        textAlign="center"
                      >
                        {label}
                      </Text>
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleCancel} color="fg.secondary">
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={selectedLogo === currentLogo}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
