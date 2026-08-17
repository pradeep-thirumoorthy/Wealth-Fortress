import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Alert, Button } from 'antd';
import { BankOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export const HoldingModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setFieldsValue({
          ticker: initialData.ticker,
          quantity: initialData.quantity,
          avg_buy_price: initialData.avg_buy_price,
          sector: initialData.sector || 'Technology',
          notes: initialData.notes || '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ sector: 'Technology' });
      }
      setError('');
    }
  }, [initialData, isOpen, form]);

  const handleFinish = async (values) => {
    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        ticker: values.ticker.trim().toUpperCase(),
        quantity: Number(values.quantity),
        avg_buy_price: Number(values.avg_buy_price),
        sector: values.sector,
        notes: values.notes,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save holding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2 text-[#5a6359] font-bold text-base font-['Plus_Jakarta_Sans',sans-serif]">
          <BankOutlined className="text-[#e87131]" />
          <span>{initialData ? `Edit Holding: ${initialData.ticker}` : 'Add Invested Company'}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={460}
      className="antd-custom-modal"
    >
      {error && (
        <Alert message={error} type="error" showIcon className="mb-4 text-xs" />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        className="mt-4"
      >
        <Form.Item
          name="ticker"
          label={<span className="text-xs font-bold uppercase text-[#5a6359]">Ticker Symbol (NSE)</span>}
          rules={[{ required: true, message: 'Please enter ticker symbol' }]}
        >
          <Input
            placeholder="RELIANCE, TCS, ATHERENERG"
            disabled={!!initialData}
            prefix={<span className="font-mono text-[#5a6359]/60 text-xs">NSE:</span>}
            className="uppercase font-mono text-sm bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] rounded-xl font-bold"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="quantity"
            label={<span className="text-xs font-bold uppercase text-[#5a6359]">Quantity</span>}
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              placeholder="10"
              min={0.0001}
              style={{ width: '100%' }}
              className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] rounded-xl font-mono font-bold"
            />
          </Form.Item>

          <Form.Item
            name="avg_buy_price"
            label={<span className="text-xs font-bold uppercase text-[#5a6359]">Avg Buy Price (₹)</span>}
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              placeholder="1200.00"
              min={0.01}
              prefix="₹"
              style={{ width: '100%' }}
              className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] rounded-xl font-mono font-bold"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="sector"
          label={<span className="text-xs font-bold uppercase text-[#5a6359]">Sector</span>}
        >
          <Select
            className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] rounded-xl font-medium"
            options={[
              { label: 'Technology', value: 'Technology' },
              { label: 'Energy', value: 'Energy' },
              { label: 'Financials', value: 'Financials' },
              { label: 'Consumer Goods', value: 'Consumer Goods' },
              { label: 'Healthcare', value: 'Healthcare' },
              { label: 'Automobile', value: 'Automobile' },
              { label: 'Metals & Mining', value: 'Metals & Mining' },
              { label: 'Infrastructure', value: 'Infrastructure' },
              { label: 'Media & Entertainment', value: 'Media & Entertainment' },
              { label: 'Defense', value: 'Defense' },
              { label: 'Uncategorized', value: 'Uncategorized' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label={<span className="text-xs font-bold uppercase text-[#5a6359]">Investment Notes</span>}
        >
          <TextArea
            rows={2}
            placeholder="Investment thesis / portfolio allocation rationale..."
            className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] rounded-xl text-xs"
          />
        </Form.Item>

        <div className="flex justify-end space-x-3 pt-3 border-t border-[#fbeed6]">
          <Button onClick={onClose} className="rounded-xl border-[#fbeed6] text-[#5a6359]">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={isSubmitting}
            className="bg-[#e87131] hover:bg-[#e87131]/90 border-0 rounded-xl font-bold text-white shadow-md"
          >
            Save Holding
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
