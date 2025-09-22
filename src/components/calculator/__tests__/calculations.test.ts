import { calculateRoomMetrics, convertToMeters, validateNumber, calculateBagQuantity } from '../utils/calculations';
import { RoomData, Unit } from '../types';

describe('calculations', () => {
    describe('convertToMeters', () => {
        it('should convert centimeters to meters', () => {
            expect(convertToMeters('100', 'cm')).toBe(1);
            expect(convertToMeters('250', 'cm')).toBe(2.5);
        });

        it('should keep meters as meters', () => {
            expect(convertToMeters('1', 'm')).toBe(1);
            expect(convertToMeters('2.5', 'm')).toBe(2.5);
        });

        it('should handle invalid input', () => {
            expect(convertToMeters('invalid', 'm')).toBe(0);
            expect(convertToMeters('', 'm')).toBe(0);
        });

        it('should handle comma as decimal separator', () => {
            expect(convertToMeters('1,5', 'm')).toBe(1.5);
            expect(convertToMeters('150,5', 'cm')).toBe(1.505);
        });
    });

    describe('calculateRoomMetrics', () => {
        const mockRoom: RoomData = {
            id: 1,
            name: 'Test Room',
            length: '5',
            width: '4',
            height: '2.8',
            unit: 'm',
            openings: [],
            exclusions: [],
            geometricElements: []
        };

        it('should calculate basic room metrics', () => {
            const result = calculateRoomMetrics(mockRoom);
            
            expect(result.floorArea).toBe(20); // 5 * 4
            expect(result.perimeter).toBe(18); // (5 + 4) * 2
            expect(result.netWallArea).toBe(50.4); // 18 * 2.8
            expect(result.height).toBe(2.8);
        });

        it('should account for openings', () => {
            const roomWithOpening: RoomData = {
                ...mockRoom,
                openings: [{
                    id: 1,
                    width: '1',
                    height: '1.5',
                    count: '1',
                    type: 'window'
                }]
            };

            const result = calculateRoomMetrics(roomWithOpening);
            expect(result.netWallArea).toBe(50.4 - 1.5); // 48.9
        });

        it('should account for doors', () => {
            const roomWithDoor: RoomData = {
                ...mockRoom,
                openings: [{
                    id: 1,
                    width: '0.8',
                    height: '2.1',
                    count: '1',
                    type: 'door'
                }]
            };

            const result = calculateRoomMetrics(roomWithDoor);
            expect(result.totalDoorWidth).toBe(0.8);
            expect(result.netWallArea).toBe(50.4 - 1.68); // 48.72
        });

        it('should handle different units', () => {
            const roomInCm: RoomData = {
                ...mockRoom,
                length: '500',
                width: '400',
                height: '280',
                unit: 'cm'
            };

            const result = calculateRoomMetrics(roomInCm);
            expect(result.floorArea).toBe(20); // 5 * 4
            expect(result.perimeter).toBe(18); // (5 + 4) * 2
        });
    });

    describe('validateNumber', () => {
        it('should validate positive numbers', () => {
            expect(validateNumber('5')).toEqual({ isValid: true });
            expect(validateNumber('5.5')).toEqual({ isValid: true });
            expect(validateNumber('0')).toEqual({ isValid: true });
        });

        it('should validate with min constraint', () => {
            expect(validateNumber('5', 3)).toEqual({ isValid: true });
            expect(validateNumber('2', 3)).toEqual({ 
                isValid: false, 
                error: 'Значение должно быть не менее 3' 
            });
        });

        it('should validate with max constraint', () => {
            expect(validateNumber('5', 0, 10)).toEqual({ isValid: true });
            expect(validateNumber('15', 0, 10)).toEqual({ 
                isValid: false, 
                error: 'Значение должно быть не более 10' 
            });
        });

        it('should handle invalid input', () => {
            expect(validateNumber('invalid')).toEqual({ 
                isValid: false, 
                error: 'Введите корректное число' 
            });
            expect(validateNumber('')).toEqual({ 
                isValid: false, 
                error: 'Введите корректное число' 
            });
        });
    });

    describe('calculateBagQuantity', () => {
        it('should calculate bag quantity correctly', () => {
            const result = calculateBagQuantity(10, 0.02, 1.2, 25, 10);
            
            expect(result.totalWeight).toBeCloseTo(2.64); // 10 * 0.02 * 1.2 * 1.1
            expect(result.bags).toBe(1); // Math.ceil(2.64 / 25)
        });

        it('should handle zero area', () => {
            const result = calculateBagQuantity(0, 0.02, 1.2, 25, 10);
            
            expect(result.totalWeight).toBe(0);
            expect(result.bags).toBe(0);
        });

        it('should handle zero bag weight', () => {
            const result = calculateBagQuantity(10, 0.02, 1.2, 0, 10);
            
            expect(result.totalWeight).toBe(0);
            expect(result.bags).toBe(0);
        });

        it('should round up bags correctly', () => {
            const result = calculateBagQuantity(100, 0.02, 1.2, 25, 10);
            
            expect(result.totalWeight).toBeCloseTo(26.4); // 100 * 0.02 * 1.2 * 1.1
            expect(result.bags).toBe(2); // Math.ceil(26.4 / 25)
        });
    });
});


