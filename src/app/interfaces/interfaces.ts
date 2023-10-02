export interface ITest {
    // ...
}

// add your interfaces here

export interface IPaging<T> {
    data: Array<T>
    paging: {
        page: number,
        limit: number,
    },
    total?: number
    errors?: Array<{
        id: number,
        message: string,
    }>
}
