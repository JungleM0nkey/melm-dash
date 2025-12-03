import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Input,
  Image,
  IconButton,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Divider,
  Grid,
  GridItem,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useRef, useMemo } from 'react';
import { Upload, Trash2, Clock, Palette, ImageIcon } from 'lucide-react';
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
  currentCustomSizeValue: number;
  onSave: (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string, customSizeValue: number) => void;
}

const LOGO_OPTIONS: Array<{ value: LogoType; label: string }> = [
  { value: 'melm', label: 'MELM' },
  { value: 'alpine', label: 'Alpine' },
  { value: 'arch', label: 'Arch' },
  { value: 'centos', label: 'CentOS' },
  { value: 'debian', label: 'Debian' },
  { value: 'fedora', label: 'Fedora' },
  { value: 'linux', label: 'Linux' },
  { value: 'nixos', label: 'NixOS' },
  { value: 'opensuse', label: 'openSUSE' },
  { value: 'ubuntu', label: 'Ubuntu' },
];

const SIZE_PRESETS: Array<{ value: Exclude<LogoSize, 'custom'>; label: string }> = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
  { value: 'xlarge', label: 'XL' },
];

const MAX_FILE_SIZE = 512 * 1024; // 512KB

interface SettingsContentProps {
  currentLogo: LogoType;
  currentSize: LogoSize;
  currentCustomLogo: string | null;
  currentTimezone: string;
  currentCustomSizeValue: number;
  onSave: (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string, customSizeValue: number) => void;
  onCancel: () => void;
}

interface SettingSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SettingSection({ icon, title, children }: SettingSectionProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <HStack spacing={2} mb={4}>
        <Box color="blue.400">{icon}</Box>
        <Text color="fg.primary" fontSize="sm" fontWeight="semibold">
          {title}
        </Text>
      </HStack>
      {children}
    </Box>
  );
}

function SettingsContent({
  currentLogo,
  currentSize,
  currentCustomLogo,
  currentTimezone,
  currentCustomSizeValue,
  onSave,
  onCancel,
}: SettingsContentProps) {
  const [selectedLogo, setSelectedLogo] = useState<LogoType>(currentLogo);
  const [selectedSize, setSelectedSize] = useState<LogoSize>(currentSize);
  const [customLogoData, setCustomLogoData] = useState<string | null>(currentCustomLogo);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(currentTimezone);
  const [customSizeValue, setCustomSizeValue] = useState<number>(currentCustomSizeValue);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timezones = useMemo(() => getAvailableTimezones(), []);
  const localTimezone = useMemo(() => getLocalTimezone(), []);

  const handleSave = () => {
    onSave(selectedLogo, selectedSize, customLogoData, selectedTimezone, customSizeValue);
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

  const handleSliderChange = (value: number) => {
    setCustomSizeValue(value);
    if (selectedSize !== 'custom') {
      setSelectedSize('custom');
    }
  };

  const handlePresetClick = (preset: Exclude<LogoSize, 'custom'>) => {
    setSelectedSize(preset);
    setCustomSizeValue(LOGO_SIZE_VALUES[preset]);
  };

  const hasChanges =
    selectedLogo !== currentLogo ||
    selectedSize !== currentSize ||
    customLogoData !== currentCustomLogo ||
    selectedTimezone !== currentTimezone ||
    customSizeValue !== currentCustomSizeValue;

  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorder = useColorModeValue('blue.500', 'blue.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const previewBg = useColorModeValue('gray.50', 'gray.800');

  // Calculate current display size
  const displaySize = selectedSize === 'custom' ? customSizeValue : LOGO_SIZE_VALUES[selectedSize];

  return (
    <>
      <ModalHeader color="fg.primary" pb={2}>Settings</ModalHeader>
      <ModalCloseButton color="fg.primary" />

      <ModalBody>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          {/* Left Column: Logo Selection with Preview */}
          <GridItem>
            <SettingSection icon={<Palette size={18} />} title="Logo">
              {/* Live Preview */}
              <Box
                bg={previewBg}
                borderRadius="md"
                p={4}
                mb={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="100px"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.2s"
                >
                  {selectedLogo === 'custom' && customLogoData ? (
                    <Image
                      src={customLogoData}
                      alt="Custom logo"
                      w={`${displaySize}px`}
                      h={`${displaySize}px`}
                      objectFit="contain"
                      borderRadius="md"
                    />
                  ) : (
                    <DistroIcon distro={selectedLogo} size={displaySize} />
                  )}
                </Box>
              </Box>

              {/* Size Control */}
              <Box mb={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text color="fg.secondary" fontSize="xs">
                    Size
                  </Text>
                  <Text color="fg.muted" fontSize="xs">
                    {displaySize}px
                  </Text>
                </Flex>
                <HStack spacing={2} mb={2}>
                  {SIZE_PRESETS.map(({ value, label }) => {
                    const isSelected = selectedSize === value;
                    return (
                      <Tooltip key={value} label={`${LOGO_SIZE_VALUES[value]}px`} hasArrow>
                        <Button
                          size="xs"
                          minW="36px"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorScheme={isSelected ? 'blue' : 'gray'}
                          onClick={() => handlePresetClick(value)}
                        >
                          {label}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </HStack>
                <Slider
                  value={customSizeValue}
                  onChange={handleSliderChange}
                  min={16}
                  max={96}
                  step={4}
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="blue.400" />
                  </SliderTrack>
                  <SliderThumb boxSize={4} />
                </Slider>
              </Box>

              <Divider my={3} />

              {/* Logo Grid */}
              <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                {LOGO_OPTIONS.map(({ value, label }) => {
                  const isSelected = selectedLogo === value;
                  return (
                    <Tooltip key={value} label={label} hasArrow placement="top">
                      <Box
                        as="button"
                        onClick={() => setSelectedLogo(value)}
                        p={2}
                        borderRadius="md"
                        borderWidth="2px"
                        borderColor={isSelected ? selectedBorder : 'transparent'}
                        bg={isSelected ? selectedBg : 'transparent'}
                        _hover={{ bg: isSelected ? selectedBg : hoverBg }}
                        transition="all 0.15s"
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <DistroIcon distro={value} size={28} />
                      </Box>
                    </Tooltip>
                  );
                })}
              </Grid>
            </SettingSection>
          </GridItem>

          {/* Right Column: Custom Logo & General Settings */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              {/* Custom Logo Upload */}
              <SettingSection icon={<ImageIcon size={18} />} title="Custom Logo">
                <VStack spacing={3} align="stretch">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    display="none"
                  />

                  {customLogoData ? (
                    <HStack
                      spacing={3}
                      p={3}
                      borderRadius="md"
                      bg={previewBg}
                      justify="space-between"
                    >
                      <HStack spacing={3}>
                        <Box
                          as="button"
                          onClick={() => setSelectedLogo('custom')}
                          cursor="pointer"
                          p={1}
                          borderRadius="md"
                          borderWidth="2px"
                          borderColor={selectedLogo === 'custom' ? selectedBorder : 'transparent'}
                        >
                          <Image
                            src={customLogoData}
                            alt="Custom logo"
                            boxSize="40px"
                            objectFit="contain"
                            borderRadius="sm"
                          />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text color="fg.primary" fontSize="sm" fontWeight="medium">
                            Custom Image
                          </Text>
                          <Text color="fg.muted" fontSize="xs">
                            Click to select
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Replace custom logo"
                          icon={<Upload size={14} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => fileInputRef.current?.click()}
                        />
                        <IconButton
                          aria-label="Remove custom logo"
                          icon={<Trash2 size={14} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={handleRemoveCustomLogo}
                        />
                      </HStack>
                    </HStack>
                  ) : (
                    <Button
                      leftIcon={<Upload size={16} />}
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => fileInputRef.current?.click()}
                      w="full"
                    >
                      Upload Custom Image
                    </Button>
                  )}

                  {uploadError && (
                    <Text color="red.400" fontSize="xs">
                      {uploadError}
                    </Text>
                  )}

                  <Text color="fg.muted" fontSize="xs">
                    PNG, JPG, or SVG up to 512KB
                  </Text>
                </VStack>
              </SettingSection>

              {/* Timezone */}
              <SettingSection icon={<Clock size={18} />} title="Timezone">
                <Select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  size="sm"
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
              </SettingSection>
            </VStack>
          </GridItem>
        </Grid>
      </ModalBody>

      <ModalFooter pt={4}>
        <Button variant="ghost" mr={3} onClick={onCancel} color="fg.secondary" size="sm">
          Cancel
        </Button>
        <Button colorScheme="blue" onClick={handleSave} isDisabled={!hasChanges} size="sm">
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
  currentCustomSizeValue,
  onSave,
}: SettingsModalProps) {
  const handleSave = (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string, customSizeValue: number) => {
    onSave(logo, size, customLogo, timezone, customSizeValue);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="bg.panel" borderColor="border.primary" borderWidth="1px">
        {isOpen && (
          <SettingsContent
            currentLogo={currentLogo}
            currentSize={currentSize}
            currentCustomLogo={currentCustomLogo}
            currentTimezone={currentTimezone}
            currentCustomSizeValue={currentCustomSizeValue}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
