'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { AlertCircle, CheckCircle2, Lock, Eye, Shield, EyeOff, Fingerprint, Bell, History, Download, Trash2, Settings } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Badge } from '@/components/ui/badge'

export default function PrivacyPage() {
  const [fieldSettings, setFieldSettings] = useState([
    { name: 'Full Name', visible: true, required: true, icon: Eye },
    { name: 'Date of Birth', visible: true, required: true, icon: History },
    { name: 'Gender', visible: true, required: false, icon: Shield },
    { name: 'Blood Group', visible: false, required: false, icon: AlertCircle },
    { name: 'Address', visible: true, required: false, icon: Lock },
    { name: 'Phone Number', visible: true, required: false, icon: Bell },
    { name: 'Email', visible: true, required: false, icon: Download },
  ])

  const [securitySettings, setSecuritySettings] = useState({
    biometric: true,
    auditTrail: true,
    notifications: true,
  })

  const toggleFieldVisibility = (name: string) => {
    setFieldSettings(
      fieldSettings.map((f) =>
        f.name === name && !f.required ? { ...f, visible: !f.visible } : f
      )
    )
  }

  const visibleCount = fieldSettings.filter((f) => f.visible).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-light font-nunito">Privacy Settings</h1>
              <p className="text-muted-foreground">
                Manage your data visibility and security preferences
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Visible Fields',
            value: visibleCount,
            total: fieldSettings.length,
            icon: Eye,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-700',
          },
          {
            label: 'Hidden Fields',
            value: fieldSettings.length - visibleCount,
            icon: EyeOff,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
          },
          {
            label: 'Security Level',
            value: 'High',
            icon: Shield,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
          },
          {
            label: 'Biometric',
            value: securitySettings.biometric ? 'On' : 'Off',
            icon: Fingerprint,
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-700',
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative overflow-hidden bg-gradient-to-br from-muted/50 to-transparent border border-border/40 rounded-xl p-4 hover:border-accent/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold font-nunito text-foreground">
                  {stat.value}
                  {stat.total && <span className="text-muted-foreground font-normal">/{stat.total}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Data Visibility Section */}
        <motion.div variants={staggerItem}>
          <Card className="p-6 md:p-8 border border-border/40 bg-gradient-to-br from-blue-50/30 to-transparent overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-nunito text-foreground">Data Visibility</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Control which fields can be accessed by organizations
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {fieldSettings.map((field) => (
                <motion.div
                  key={field.name}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className={`flex items-center justify-between p-4 rounded-xl bg-white/60 border transition-all duration-300 ${
                    field.visible 
                      ? 'border-green-200/50 hover:border-green-300' 
                      : 'border-border/30 hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <field.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{field.name}</span>
                      {field.required && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-red-200 text-red-600 bg-red-50">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {field.visible ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">Visible</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Hidden</span>
                      </div>
                    )}
                    {!field.required && (
                      <Switch
                        checked={field.visible}
                        onCheckedChange={() => toggleFieldVisibility(field.name)}
                        aria-label={`Toggle visibility for ${field.name}`}
                        className="data-[state=checked]:bg-green-500"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Security Section */}
        <motion.div variants={staggerItem}>
          <Card className="p-6 md:p-8 border border-border/40 bg-gradient-to-br from-green-50/30 to-transparent overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-nunito text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account protection and verification settings
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'biometric',
                  title: 'Biometric Verification',
                  description: 'Face matching with liveness detection',
                  icon: Fingerprint,
                  enabled: securitySettings.biometric,
                },
                {
                  key: 'auditTrail',
                  title: 'Access Audit Trail',
                  description: 'Keep track of all verifications and access requests',
                  icon: History,
                  enabled: securitySettings.auditTrail,
                },
                {
                  key: 'notifications',
                  title: 'Security Notifications',
                  description: 'Get notified when your identity is verified',
                  icon: Bell,
                  enabled: securitySettings.notifications,
                },
              ].map((item) => (
                <motion.div
                  key={item.key}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className={`flex items-start justify-between p-4 rounded-xl bg-white/60 border transition-all duration-300 ${
                    item.enabled 
                      ? 'border-green-200/50 hover:border-green-300' 
                      : 'border-border/30 hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${item.enabled ? 'bg-green-100' : 'bg-muted'} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`h-5 w-5 ${item.enabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      item.enabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, [item.key]: checked })
                      }
                      aria-label={`Toggle ${item.title}`}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Data Export Section */}
        <motion.div variants={staggerItem}>
          <Card className="p-6 md:p-8 border border-border/40 bg-gradient-to-br from-purple-50/30 to-transparent overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-nunito text-foreground">Data Export</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Download a copy of all your NagarikID data
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full md:w-auto border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Request Data Export
            </Button>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={staggerItem}>
          <Card className="p-6 md:p-8 border-2 border-red-200 bg-gradient-to-br from-red-50 to-transparent overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-nunito text-red-900">Danger Zone</h3>
                <p className="text-sm text-red-800/80 mt-1">
                  These actions are permanent and cannot be undone
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="destructive"
                className="w-full justify-center font-semibold hover:bg-red-700 transition-all duration-300 h-12"
              >
                <Lock className="h-4 w-4 mr-2" />
                Deactivate Account
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300 h-12"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All My Data
              </Button>
            </div>

            <div className="mt-4 p-4 bg-red-100/50 rounded-xl border border-red-200/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed">
                  <span className="font-bold">Warning:</span> Deactivating or deleting your account will permanently remove all your information from NagarikID. This action cannot be recovered.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
