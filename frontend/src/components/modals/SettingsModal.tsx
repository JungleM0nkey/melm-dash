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
  HStack,
  useColorModeValue,
  Input,
  Image,
  IconButton,
  Divider,
  Select,
} from '@chakra-ui/react';
import { useState, useRef, useMemo } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { LogoType, LogoSize } from '../../hooks/useLogoPreference';
import { LOGO_SIZE_VALUES } from '../../hooks/useLogoPreference';
import { DistroIcon } from '../panels/DistroIcon';
import {
  getAvailableTimezones,
  getLocalTimezone,
} from '../../hooks/useTimezonePreference';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: LogoType;
  currentSize: LogoSize;
  currentCustomLogo: string | null;
  currentTimezone: string;
  onSave: (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string) => void;
}

const LOGO_OPTIONS: Array<{ value: LogoType; label: string; span?: number }> = [
  { value: 'melm', label: 'MELM', span: 2 },
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

const SIZE_OPTIONS: Array<{ value: LogoSize; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const MAX_FILE_SIZE = 512 * 1024; // 512KB

interface SettingsContentProps {
  currentLogo: LogoType;
  currentSize: LogoSize;
  currentCustomLogo: string | null;
  currentTimezone: string;
  onSave: (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string) => void;
  onCancel: () => void;
}

function SettingsContent({
  currentLogo,
  currentSize,
  currentCustomLogo,
  currentTimezone,
  onSave,
  onCancel,
}: SettingsContentProps) {
  const [selectedLogo, setSelectedLogo] = useState<LogoType>(currentLogo);
  const [selectedSize, setSelectedSize] = useState<LogoSize>(currentSize);
  const [customLogoData, setCustomLogoData] = useState<string | null>(currentCustomLogo);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(currentTimezone);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get available timezones
  const timezones = useMemo(() => getAvailableTimezones(), []);
  const localTimezone = useMemo(() => getLocalTimezone(), []);

  const handleSave = () => {
    onSave(selectedLogo, selectedSize, customLogoData, selectedTimezone);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image must be smaller than 512KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCustomLogoData(result);
      setSelectedLogo('custom');
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCustomLogo = () => {
    setCustomLogoData(null);
    if (selectedLogo === 'custom') {
      setSelectedLogo('melm');
    }
  };

  const hasChanges =
    selectedLogo !== currentLogo ||
    selectedSize !== currentSize ||
    customLogoData !== currentCustomLogo ||
    selectedTimezone !== currentTimezone;

  const selectedBg = useColorModeValue('blue.100', 'blue.700');
  const selectedBorder = useColorModeValue('blue.500', 'blue.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <>
      <ModalHeader color="fg.primary">Settings</ModalHeader>
      <ModalCloseButton color="fg.primary" />

      <ModalBody>
        <VStack align="stretch" spacing={6}>
          {/* Timezone Section */}
          <Box>
            <Text color="fg.primary" fontSize="sm" fontWeight="semibold" mb={3}>
              Timezone
            </Text>
            <Text color="fg.secondary" fontSize="xs" mb={3}>
              Select the timezone for displaying local time
            </Text>
            <Select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              size="sm"
              maxW="350px"
              color="fg.primary"
              borderColor={borderColor}
              _hover={{ borderColor: selectedBorder }}
            >
              <option value="auto">Auto ({localTimezone})</option>
              {timezones
                .filter((tz) => tz !== 'auto')
                .map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
            </Select>
          </Box>

          <Divider borderColor="border.primary" />

          {/* Logo Size Section */}
          <Box>
            <Text color="fg.primary" fontSize="sm" fontWeight="semibold" mb={3}>
              Logo Size
            </Text>
            <HStack spacing={3}>
              {SIZE_OPTIONS.map(({ value, label }) => {
                const isSelected = selectedSize === value;
                return (
                  <Button
                    key={value}
                    size="sm"
                    variant={isSelected ? 'solid' : 'outline'}
                    colorScheme={isSelected ? 'blue' : 'gray'}
                    onClick={() => setSelectedSize(value)}
                  >
                    {label} ({LOGO_SIZE_VALUES[value]}px)
                  </Button>
                );
              })}
            </HStack>
          </Box>

          <Divider borderColor="border.primary" />

          {/* Custom Logo Upload Section */}
          <Box>
            <Text color="fg.primary" fontSize="sm" fontWeight="semibold" mb={3}>
              Custom Logo
            </Text>
            <HStack spacing={4} align="start">
              <VStack spacing={2} align="start">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  display="none"
                />
                <Button
                  leftIcon={<Upload size={16} />}
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </Button>
                <Text color="fg.muted" fontSize="xs">
                  Max 512KB, PNG/JPG/SVG recommended
                </Text>
                {uploadError && (
                  <Text color="red.400" fontSize="xs">
                    {uploadError}
                  </Text>
                )}
              </VStack>

              {customLogoData && (
                <HStack
                  spacing={2}
                  p={3}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={selectedLogo === 'custom' ? selectedBorder : borderColor}
                  bg={selectedLogo === 'custom' ? selectedBg : 'transparent'}
                >
                  <Box
                    as="button"
                    onClick={() => setSelectedLogo('custom')}
                    cursor="pointer"
                  >
                    <Image
                      src={customLogoData}
                      alt="Custom logo preview"
                      boxSize="48px"
                      objectFit="contain"
                      borderRadius="md"
                    />
                  </Box>
                  <IconButton
                    aria-label="Remove custom logo"
                    icon={<Trash2 size={14} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleRemoveCustomLogo}
                  />
                </HStack>
              )}
            </HStack>
          </Box>

          <Divider borderColor="border.primary" />

          {/* Preset Logos Section */}
          <Box>
            <Text color="fg.primary" fontSize="sm" fontWeight="semibold" mb={3}>
              Preset Logos
            </Text>
            <Text color="fg.secondary" fontSize="xs" mb={3}>
              Select a logo to display in the dashboard header
            </Text>

            <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4}>
              {LOGO_OPTIONS.map(({ value, label, span }) => {
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
                      transform: 'scale(1.02)',
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    position="relative"
                    gridColumn={span ? `span ${span}` : undefined}
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
          </Box>
        </VStack>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" mr={3} onClick={onCancel} color="fg.secondary">
          Cancel
        </Button>
        <Button colorScheme="blue" onClick={handleSave} isDisabled={!hasChanges}>
          Save Changes
        </Button>
      </ModalFooter>
    </>
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  currentLogo,
  currentSize,
  currentCustomLogo,
  currentTimezone,
  onSave,
}: SettingsModalProps) {
  const handleSave = (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string) => {
    onSave(logo, size, customLogo, timezone);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="bg.panel" borderColor="border.primary" borderWidth="1px">
        {isOpen && (
          <SettingsContent
            currentLogo={currentLogo}
            currentSize={currentSize}
            currentCustomLogo={currentCustomLogo}
            currentTimezone={currentTimezone}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
