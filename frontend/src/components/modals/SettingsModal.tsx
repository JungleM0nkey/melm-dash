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
import { Upload, Trash2, Clock, Palette, ImageIcon, Sun, Moon, Monitor, Square, RectangleHorizontal } from 'lucide-react';
import type { LogoType, LogoSize } from '../../hooks/useLogoPreference';
import { LOGO_SIZE_VALUES } from '../../hooks/useLogoPreference';
import { DistroIcon } from '../panels/DistroIcon';
import {
  getAvailableTimezones,
  getLocalTimezone,
} from '../../hooks/useTimezonePreference';
import type { ThemeMode } from '../../hooks/useThemePreference';
import type { BorderRadiusStyle } from '../../hooks/useBorderRadius';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: LogoType;
  currentSize: LogoSize;
  currentCustomLogo: string | null;
  currentTimezone: string;
  currentCustomSizeValue: number;
  currentTheme: ThemeMode;
  currentLogoColor: string;
  currentBorderRadius: BorderRadiusStyle;
  onSave: (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string, customSizeValue: number, theme: ThemeMode, logoColor: string, borderRadius: BorderRadiusStyle) => void;
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

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: typeof Sun; description: string }> = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
];

const BORDER_RADIUS_OPTIONS: Array<{ value: BorderRadiusStyle; label: string; icon: typeof Square }> = [
  { value: 'sharp', label: 'Sharp', icon: Square },
  { value: 'rounded', label: 'Rounded', icon: RectangleHorizontal },
];

// Preset colors for the logo color picker
const PRESET_COLORS = [
  '', // Default (no color / gray)
  '#805AD5', // Purple
  '#4299E1', // Blue
  '#38B2AC', // Teal
  '#48BB78', // Green
  '#ECC94B', // Yellow
  '#ED8936', // Orange
  '#F56565', // Red
  '#ED64A6', // Pink
  '#FFFFFF', // White
];

interface SettingsContentProps {
  currentLogo: LogoType;
  currentSize: LogoSize;
  currentCustomLogo: string | null;
  currentTimezone: string;
  currentCustomSizeValue: number;
  currentTheme: ThemeMode;
  currentLogoColor: string;
  currentBorderRadius: BorderRadiusStyle;
  onSave: (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string, customSizeValue: number, theme: ThemeMode, logoColor: string, borderRadius: BorderRadiusStyle) => void;
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
      flex="1"
      display="flex"
      flexDirection="column"
    >
      <HStack spacing={2} mb={4}>
        <Box color="blue.400">{icon}</Box>
        <Text color="fg.primary" fontSize="sm" fontWeight="semibold">
          {title}
        </Text>
      </HStack>
      <Box flex="1">{children}</Box>
    </Box>
  );
}

function SettingsContent({
  currentLogo,
  currentSize,
  currentCustomLogo,
  currentTimezone,
  currentCustomSizeValue,
  currentTheme,
  currentLogoColor,
  currentBorderRadius,
  onSave,
  onCancel,
}: SettingsContentProps) {
  const [selectedLogo, setSelectedLogo] = useState<LogoType>(currentLogo);
  const [selectedSize, setSelectedSize] = useState<LogoSize>(currentSize);
  const [customLogoData, setCustomLogoData] = useState<string | null>(currentCustomLogo);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(currentTimezone);
  const [customSizeValue, setCustomSizeValue] = useState<number>(currentCustomSizeValue);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(currentTheme);
  const [selectedLogoColor, setSelectedLogoColor] = useState<string>(currentLogoColor);
  const [selectedBorderRadius, setSelectedBorderRadius] = useState<BorderRadiusStyle>(currentBorderRadius);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timezones = useMemo(() => getAvailableTimezones(), []);
  const localTimezone = useMemo(() => getLocalTimezone(), []);

  const handleSave = () => {
    onSave(selectedLogo, selectedSize, customLogoData, selectedTimezone, customSizeValue, selectedTheme, selectedLogoColor, selectedBorderRadius);
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
    customSizeValue !== currentCustomSizeValue ||
    selectedTheme !== currentTheme ||
    selectedLogoColor !== currentLogoColor ||
    selectedBorderRadius !== currentBorderRadius;

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
                    <DistroIcon distro={selectedLogo} size={displaySize} color={selectedLogoColor} />
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
                        <DistroIcon distro={value} size={28} color={selectedLogoColor} />
                      </Box>
                    </Tooltip>
                  );
                })}
              </Grid>

              <Divider my={3} />

              {/* Logo Color Picker */}
              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text color="fg.secondary" fontSize="xs">
                    Color
                  </Text>
                  <Text color="fg.muted" fontSize="xs">
                    {selectedLogoColor || 'Default'}
                  </Text>
                </Flex>
                <HStack spacing={2} flexWrap="wrap">
                  {PRESET_COLORS.map((color, index) => {
                    const isSelected = selectedLogoColor === color;
                    const isDefault = color === '';
                    return (
                      <Tooltip key={index} label={isDefault ? 'Default (Gray)' : color} hasArrow>
                        <Box
                          as="button"
                          onClick={() => setSelectedLogoColor(color)}
                          w="28px"
                          h="28px"
                          borderRadius="md"
                          borderWidth="2px"
                          borderColor={isSelected ? selectedBorder : borderColor}
                          bg={isDefault ? 'gray.500' : color}
                          _hover={{ transform: 'scale(1.1)' }}
                          transition="all 0.15s"
                          cursor="pointer"
                          position="relative"
                        >
                          {isDefault && (
                            <Box
                              position="absolute"
                              top="50%"
                              left="50%"
                              transform="translate(-50%, -50%)"
                              w="60%"
                              h="2px"
                              bg="gray.300"
                              borderRadius="full"
                              style={{ transform: 'translate(-50%, -50%) rotate(-45deg)' }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </HStack>
              </Box>
            </SettingSection>
          </GridItem>

          {/* Right Column: Custom Logo & General Settings */}
          <GridItem display="flex" flexDirection="column">
            <VStack spacing={4} align="stretch" flex="1">
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

              {/* Theme - flex to fill remaining space */}
              <Box flex="1" display="flex" flexDirection="column">
                <SettingSection icon={<Sun size={18} />} title="Theme">
                  <VStack spacing={3} align="stretch">
                  <HStack spacing={2}>
                    {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                      const isSelected = selectedTheme === value;
                      return (
                        <Button
                          key={value}
                          size="sm"
                          flex="1"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorScheme={isSelected ? 'blue' : 'gray'}
                          leftIcon={<Icon size={16} />}
                          onClick={() => setSelectedTheme(value)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </HStack>
                  <Text color="fg.muted" fontSize="xs">
                    {THEME_OPTIONS.find((opt) => opt.value === selectedTheme)?.description}
                  </Text>

                  <Divider />

                  {/* Corner Style */}
                  <Box>
                    <Text color="fg.secondary" fontSize="xs" mb={2}>
                      Corners
                    </Text>
                    <HStack spacing={2}>
                      {BORDER_RADIUS_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const isSelected = selectedBorderRadius === value;
                        return (
                          <Button
                            key={value}
                            size="sm"
                            flex="1"
                            variant={isSelected ? 'solid' : 'outline'}
                            colorScheme={isSelected ? 'blue' : 'gray'}
                            leftIcon={<Icon size={16} />}
                            onClick={() => setSelectedBorderRadius(value)}
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </HStack>
                  </Box>
                </VStack>
              </SettingSection>
              </Box>
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
  currentTheme,
  currentLogoColor,
  currentBorderRadius,
  onSave,
}: SettingsModalProps) {
  const handleSave = (logo: LogoType, size: LogoSize, customLogo: string | null, timezone: string, customSizeValue: number, theme: ThemeMode, logoColor: string, borderRadius: BorderRadiusStyle) => {
    onSave(logo, size, customLogo, timezone, customSizeValue, theme, logoColor, borderRadius);
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
            currentTheme={currentTheme}
            currentLogoColor={currentLogoColor}
            currentBorderRadius={currentBorderRadius}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
