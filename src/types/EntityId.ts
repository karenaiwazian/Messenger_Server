export type EntityId = number

export function EntityId(number: number | string): EntityId {
    return Number(number)
}